'use client';

import React, { useState, useEffect, useRef } from 'react';
import SiteHeader from '@/components/layout/SiteHeader';

const TEMPLATE_CATEGORIES = {
  mathematics: {
    label: 'Mathematics 🧮',
    icon: '📐',
    templates: [
      { name: 'Counting', defaultPrompt: 'Draw groups of objects (stars, apples, cups) and let children write the count in the answer box.', recommendedLayout: 2, recommendedFont: 'Playpen Sans', recommendedSpacing: 'compact', recommendedIllustrationStyle: 'cute hand-drawn cartoon outlines', grade: 'lkg', subject: 'math', topic: 'counting', skill: 'count-objects-1-to-10' },
      { name: 'Addition', defaultPrompt: 'Single digit addition sums using pictures for counting visual aids.', recommendedLayout: 1, recommendedFont: 'Playpen Sans', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'fruit and animal outlines', grade: 'ukg', subject: 'math', topic: 'addition', skill: 'single-digit-addition' },
      { name: 'Subtraction', defaultPrompt: 'Visual subtraction exercises. Draw objects, cross some out, and count the remainder.', recommendedLayout: 1, recommendedFont: 'Playpen Sans', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'simple vector shapes', grade: 'ukg', subject: 'math', topic: 'subtraction', skill: 'single-digit-subtraction' },
      { name: 'Multiplication', defaultPrompt: 'Introduction to basic multiplication tables (2x, 5x, 10x) using groups of items.', recommendedLayout: 2, recommendedFont: 'Outfit', recommendedSpacing: 'compact', recommendedIllustrationStyle: 'repeating geometric pattern drawings', grade: 'grade-1', subject: 'math', topic: 'multiplication', skill: 'intro-multiplication' },
      { name: 'Fractions', defaultPrompt: 'Identify and shade fractions (half, quarter, third) of circles and rectangles.', recommendedLayout: 2, recommendedFont: 'Outfit', recommendedSpacing: 'compact', recommendedIllustrationStyle: 'clean minimalist geometric slices', grade: 'grade-2', subject: 'math', topic: 'fractions', skill: 'fraction-slices' },
      { name: 'Geometry', defaultPrompt: 'Identify shapes (triangles, rectangles, hexagons) and count their vertices and edges.', recommendedLayout: 2, recommendedFont: 'Outfit', recommendedSpacing: 'compact', recommendedIllustrationStyle: 'sharp black-line polygon drawings', grade: 'grade-2', subject: 'math', topic: 'geometry', skill: 'shape-attributes' },
      { name: 'Measurement', defaultPrompt: 'Read values from standard rulers (inches and centimeters) to measure length.', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'flat ruler and object sketches', grade: 'grade-2', subject: 'math', topic: 'measurement', skill: 'read-ruler' },
      { name: 'Word Problems', defaultPrompt: 'Grade 6 word problems on ratios, unit rates, and proportions.', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'none (text only)', grade: 'grade-6', subject: 'math', topic: 'ratios', skill: 'ratio-word-problems' }
    ]
  },
  english: {
    label: 'English 📖',
    icon: '✍️',
    templates: [
      { name: 'Alphabet', defaultPrompt: 'Uppercase and lowercase letter tracing and match items starting with each letter.', recommendedLayout: 2, recommendedFont: 'Playpen Sans', recommendedSpacing: 'compact', recommendedIllustrationStyle: 'tracing dotted guides and sketches', grade: 'lkg', subject: 'english', topic: 'alphabet', skill: 'letter-tracing' },
      { name: 'Phonics', defaultPrompt: 'Choose the word that has the short vowel sound. Add image placeholders next to options.', recommendedLayout: 2, recommendedFont: 'Playpen Sans', recommendedSpacing: 'compact', recommendedIllustrationStyle: 'simple object clip-art outlines', grade: 'ukg', subject: 'english', topic: 'phonics', skill: 'short-vowel-phonics' },
      { name: 'Rhyming', defaultPrompt: 'Identify and match rhyming pairs. Display multiple choices.', recommendedLayout: 1, recommendedFont: 'Playpen Sans', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'playful cartoon sketches', grade: 'ukg', subject: 'english', topic: 'rhyming', skill: 'rhyming-words' },
      { name: 'Reading', defaultPrompt: 'Identify high-frequency sight words in basic sentences.', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'simple illustration triggers', grade: 'ukg', subject: 'english', topic: 'reading', skill: 'sight-words' },
      { name: 'Grammar', defaultPrompt: 'Fill in the blanks with correct singular or plural nouns (e.g. book vs books).', recommendedLayout: 2, recommendedFont: 'Outfit', recommendedSpacing: 'compact', recommendedIllustrationStyle: 'noun clip-art diagrams', grade: 'grade-1', subject: 'english', topic: 'grammar', skill: 'singular-plural' },
      { name: 'Vocabulary', defaultPrompt: 'Match synonyms and antonyms of common grade-appropriate adjectives.', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'text-focused layout', grade: 'grade-2', subject: 'english', topic: 'vocabulary', skill: 'synonyms-antonyms' },
      { name: 'Sentence Writing', defaultPrompt: 'Unscramble words to construct grammatically correct simple sentences.', recommendedLayout: 1, recommendedFont: 'Playpen Sans', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'dashed text writing guides', grade: 'grade-1', subject: 'english', topic: 'sentence-building', skill: 'sentence-scramble' },
      { name: 'Comprehension', defaultPrompt: 'Read a short 4-sentence story and answer simple recall multiple choice questions.', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'story context background box', grade: 'grade-2', subject: 'english', topic: 'comprehension', skill: 'short-story-recall' }
    ]
  },
  science: {
    label: 'Science 🧪',
    icon: '🌍',
    templates: [
      { name: 'Plants', defaultPrompt: 'Identify parts of a plant (roots, stem, leaves, flower) and label them.', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'clean botanical sketches with label lines', grade: 'grade-1', subject: 'science', topic: 'plants', skill: 'plant-structure' },
      { name: 'Animals', defaultPrompt: 'Classify animals into herbivores, carnivores, and omnivores.', recommendedLayout: 2, recommendedFont: 'Outfit', recommendedSpacing: 'compact', recommendedIllustrationStyle: 'animal sketches', grade: 'grade-2', subject: 'science', topic: 'animals', skill: 'diet-classification' },
      { name: 'Human Body', defaultPrompt: 'Identify the five human senses and match them to body organs.', recommendedLayout: 2, recommendedFont: 'Playpen Sans', recommendedSpacing: 'compact', recommendedIllustrationStyle: 'face and sense organ icons', grade: 'ukg', subject: 'science', topic: 'human-body', skill: 'five-senses' },
      { name: 'Force', defaultPrompt: 'Differentiate between push and pull forces in daily activities.', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'action stick-figure sketches', grade: 'grade-2', subject: 'science', topic: 'physics', skill: 'push-pull-force' },
      { name: 'Motion', defaultPrompt: 'Identify rectilinear, circular, and oscillatory motion from descriptions.', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'motion path vector drawings', grade: 'grade-6', subject: 'physics', topic: 'mechanics', skill: 'motion-types-misc' },
      { name: 'Energy', defaultPrompt: 'Classify energy sources into kinetic and potential energy examples.', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'energy flow diagrams', grade: 'grade-6', subject: 'physics', topic: 'energy', skill: 'energy-forms' },
      { name: 'Electricity', defaultPrompt: 'Label components of a simple series electrical circuit (battery, bulb, switch).', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'schematic circuit diagram drawings', grade: 'grade-6', subject: 'physics', topic: 'electricity', skill: 'circuit-diagrams' }
    ]
  },
  reasoning: {
    label: 'Reasoning 🧠',
    icon: '💡',
    templates: [
      { name: 'Patterns', defaultPrompt: 'Complete the pattern sequence of alternating geometric shapes.', recommendedLayout: 2, recommendedFont: 'Playpen Sans', recommendedSpacing: 'compact', recommendedIllustrationStyle: 'bold geometric shape outlines', grade: 'ukg', subject: 'math', topic: 'reasoning', skill: 'pattern-completion' },
      { name: 'Analogies', defaultPrompt: 'Complete verbal or visual analogies (e.g. A is to B as C is to ...).', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'minimalist vector icons', grade: 'grade-2', subject: 'math', topic: 'reasoning', skill: 'logical-analogies' },
      { name: 'Coding', defaultPrompt: 'Substitute letters with numbers to decode a secret word based on a given key.', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'none (grid lookup tables)', grade: 'grade-6', subject: 'math', topic: 'reasoning', skill: 'word-coding' },
      { name: 'Direction Sense', defaultPrompt: 'Trace directional moves (e.g. walk 5m north, turn east) to find final placement.', recommendedLayout: 1, recommendedFont: 'Outfit', recommendedSpacing: 'standard', recommendedIllustrationStyle: 'cardinal direction compass sketch', grade: 'grade-6', subject: 'math', topic: 'reasoning', skill: 'direction-tracking' },
      { name: 'Classification', defaultPrompt: 'Odd one out: Select the item that does not belong in the set.', recommendedLayout: 2, recommendedFont: 'Playpen Sans', recommendedSpacing: 'compact', recommendedIllustrationStyle: 'simple object drawings', grade: 'grade-1', subject: 'math', topic: 'reasoning', skill: 'find-odd-one' }
    ]
  }
};

const SIDEBAR_ITEMS = [
  { id: 'library', label: 'Worksheet Library', icon: '📂' },
  { id: 'templates', label: 'Templates', icon: '📝' },
  { id: 'generator', label: 'AI Generator', icon: '✨', active: true },
  { id: 'drafts', label: 'Saved Drafts', icon: '💾' },
  { id: 'assets', label: 'Assets', icon: '🖼️' },
  { id: 'curriculum', label: 'Curriculum', icon: '🎯' },
  { id: 'recent', label: 'Recent Files', icon: '⏳' }
];

export default function WorksheetsDemoPage() {
  const [activeCategory, setActiveCategory] = useState('mathematics');
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);

  const [grade, setGrade] = useState('ukg');
  const [subject, setSubject] = useState('english');
  const [topic, setTopic] = useState('english-reading-foundations');
  const [skill, setSkill] = useState('eng-short-u-find');
  const [columns, setColumns] = useState(1);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  
  const [font, setFont] = useState('Outfit');
  const [spacing, setSpacing] = useState('compact');
  const [illustrationStyle, setIllustrationStyle] = useState('cartoon outlines');

  // ── Structured Prompt Builder States (Section 3) ──
  const [learningGoal, setLearningGoal] = useState('Practice identifying base-ten values');
  const [questionStyle, setQuestionStyle] = useState('Multiple Choice');
  const [difficulty, setDifficulty] = useState('Medium');
  const [theme, setTheme] = useState('Space Exploration');
  const [characters, setCharacters] = useState('Alex the astronaut');
  const [vocabLevel, setVocabLevel] = useState('Beginner');
  const [realLifeContext, setRealLifeContext] = useState('Managing space fuel cells');
  const [bloomLevel, setBloomLevel] = useState('Applying');
  const [misconceptions, setMisconceptions] = useState('counting place values incorrectly');
  const [teacherInstructions, setTeacherInstructions] = useState('Ensure students look at the visual diagrams before answering.');
  const [extraInstructions, setExtraInstructions] = useState('');

  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [advancedPromptText, setAdvancedPromptText] = useState('');
  const [promptHistory, setPromptHistory] = useState([]);
  const [savedPrompts, setSavedPrompts] = useState([
    { label: '🚀 Grade 6 Space Math', config: { learningGoal: 'Area of shapes', questionStyle: 'Word Problems', difficulty: 'Hard', theme: 'Mars Colonization', characters: 'Commander Sarah', vocabLevel: 'Intermediate', realLifeContext: 'Solar panel sizing', bloomLevel: 'Creating', misconceptions: 'forgetting shape formula divisions', teacherInstructions: 'Have students draw shapes first', extraInstructions: '' } }
  ]);

  const [activePromptField, setActivePromptField] = useState('learningGoal');

  const [isLoading, setIsLoading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Compile the final prompt dynamically from variables
  const compilePrompt = () => {
    if (isAdvancedMode) {
      return advancedPromptText;
    }

    const segments = [];
    if (learningGoal) segments.push(`Learning Goal: ${learningGoal}`);
    if (questionStyle) segments.push(`Question Style: ${questionStyle}`);
    if (difficulty) segments.push(`Difficulty: ${difficulty}`);
    if (theme) segments.push(`Theme: ${theme}`);
    if (characters) segments.push(`Characters: ${characters}`);
    if (vocabLevel) segments.push(`Vocabulary Level: ${vocabLevel}`);
    if (realLifeContext) segments.push(`Real-life Context: ${realLifeContext}`);
    if (bloomLevel) segments.push(`Bloom's Taxonomy Level: ${bloomLevel}`);
    if (misconceptions) segments.push(`Misconceptions to Target: ${misconceptions}`);
    if (teacherInstructions) segments.push(`Teacher Instructions: ${teacherInstructions}`);
    if (extraInstructions) segments.push(`Extra Directives: ${extraInstructions}`);

    let result = segments.join('\n');
    // Replace Variables
    result = result
      .replace(/\{\{GRADE\}\}/g, grade.toUpperCase())
      .replace(/\{\{SUBJECT\}\}/g, subject.toUpperCase())
      .replace(/\{\{TOPIC\}\}/g, topic)
      .replace(/\{\{SKILL\}\}/g, skill);

    return result;
  };

  // Synchronize advanced mode textbox when switching
  useEffect(() => {
    if (isAdvancedMode) {
      setAdvancedPromptText(compilePrompt());
    }
  }, [isAdvancedMode]);

  const loadTemplate = (tmpl, index) => {
    setActiveTemplateIndex(index);
    setGrade(tmpl.grade);
    setSubject(tmpl.subject);
    setTopic(tmpl.topic);
    setSkill(tmpl.skill);
    setLearningGoal(`Master the skill: ${tmpl.name}`);
    setExtraInstructions(tmpl.defaultPrompt);
    setColumns(tmpl.recommendedLayout);
    setFont(tmpl.recommendedFont);
    setSpacing(tmpl.recommendedSpacing);
    setIllustrationStyle(tmpl.recommendedIllustrationStyle);
    showToast(`Loaded Template: ${tmpl.name}`);
  };

  // Auto load first template when category shifts
  useEffect(() => {
    const list = TEMPLATE_CATEGORIES[activeCategory].templates;
    if (list && list[0]) {
      loadTemplate(list[0], 0);
    }
  }, [activeCategory]);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    const finalPrompt = compilePrompt();

    // Add to prompt history
    if (!promptHistory.includes(finalPrompt)) {
      setPromptHistory(prev => [finalPrompt, ...prev.slice(0, 4)]);
    }

    try {
      const response = await fetch('/api/worksheets/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade,
          subject,
          topic,
          skill,
          customPrompt: finalPrompt,
          columns,
          includeAnswers,
          font,
          spacing,
          illustrationStyle
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Generation failed');
      }

      const pdfBlob = await response.blob();
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(blobUrl);
      showToast('PDF Worksheet generated successfully!');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong while generating the worksheet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewWorksheet = () => {
    setGrade('ukg');
    setSubject('english');
    setTopic('english-reading-foundations');
    setSkill('eng-short-u-find');
    setColumns(1);
    setFont('Outfit');
    setSpacing('compact');
    setIllustrationStyle('cartoon outlines');
    setIncludeAnswers(true);
    
    // Clear prompt builder
    setLearningGoal('');
    setTheme('');
    setCharacters('');
    setRealLifeContext('');
    setMisconceptions('');
    setTeacherInstructions('');
    setExtraInstructions('');
    setAdvancedPromptText('');

    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    showToast('Cleared workspace. Starting new worksheet...');
  };

  const handleSaveDraft = () => {
    showToast('Saved draft to your workspace successfully!');
  };

  const handleDuplicate = () => {
    showToast('Duplicated worksheet config!');
  };

  const handlePublish = () => {
    showToast('🚀 Worksheet published to student curriculum database!');
  };

  const handleSavePromptConfig = () => {
    const label = prompt(`Enter a label for this saved prompt config:`, `Math Config - ${theme || 'Default'}`);
    if (label && label.trim()) {
      const newSaved = {
        label: label.trim(),
        config: {
          learningGoal,
          questionStyle,
          difficulty,
          theme,
          characters,
          vocabLevel,
          realLifeContext,
          bloomLevel,
          misconceptions,
          teacherInstructions,
          extraInstructions
        }
      };
      setSavedPrompts(prev => [...prev, newSaved]);
      showToast('Saved prompt to library!');
    }
  };

  const loadSavedPrompt = (saved) => {
    const c = saved.config;
    setLearningGoal(c.learningGoal || '');
    setQuestionStyle(c.questionStyle || 'Multiple Choice');
    setDifficulty(c.difficulty || 'Medium');
    setTheme(c.theme || '');
    setCharacters(c.characters || '');
    setVocabLevel(c.vocabLevel || 'Beginner');
    setRealLifeContext(c.realLifeContext || '');
    setBloomLevel(c.bloomLevel || 'Applying');
    setMisconceptions(c.misconceptions || '');
    setTeacherInstructions(c.teacherInstructions || '');
    setExtraInstructions(c.extraInstructions || '');
    showToast(`Loaded prompt config: ${saved.label}`);
  };

  const appendVariable = (variable) => {
    // Append to active prompt textbox
    if (activePromptField === 'learningGoal') setLearningGoal(prev => prev + ' ' + variable);
    else if (activePromptField === 'theme') setTheme(prev => prev + ' ' + variable);
    else if (activePromptField === 'characters') setCharacters(prev => prev + ' ' + variable);
    else if (activePromptField === 'realLifeContext') setRealLifeContext(prev => prev + ' ' + variable);
    else if (activePromptField === 'misconceptions') setMisconceptions(prev => prev + ' ' + variable);
    else if (activePromptField === 'teacherInstructions') setTeacherInstructions(prev => prev + ' ' + variable);
    else if (activePromptField === 'extraInstructions') setExtraInstructions(prev => prev + ' ' + variable);
    showToast(`Appended variable ${variable}`);
  };

  const currentCategoryObj = TEMPLATE_CATEGORIES[activeCategory];

  return (
    <div style={{ backgroundColor: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', color: '#f8fafc', fontFamily: "'Outfit', sans-serif", overflow: 'hidden' }}>
      <SiteHeader />
      
      {/* ── Top Toolbar ── */}
      <div style={{ 
        height: '60px', 
        backgroundColor: '#1e293b', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 24px',
        zIndex: 10
      }}>
        {/* Left Toolbar Operations */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={handleNewWorksheet} className="toolbar-btn" style={toolbarStyle}>
            📄 New
          </button>
          <button onClick={handleSaveDraft} className="toolbar-btn" style={toolbarStyle}>
            💾 Save Draft
          </button>
          <button onClick={handleDuplicate} className="toolbar-btn" style={toolbarStyle}>
            👯 Duplicate
          </button>
          <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>
          <button onClick={() => showToast('Undo operation')} className="toolbar-btn" style={toolbarStyle}>
            ↩️ Undo
          </button>
          <button onClick={() => showToast('Redo operation')} className="toolbar-btn" style={toolbarStyle}>
            ↪️ Redo
          </button>
        </div>

        {/* Right Toolbar Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => showToast('Opening preview dialog...')} className="toolbar-btn" style={toolbarStyle}>
            👁️ Preview
          </button>
          <button 
            onClick={handleGenerate} 
            disabled={isLoading}
            className="toolbar-btn-primary" 
            style={{ ...toolbarStyle, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#ffffff', border: 'none', padding: '8px 16px', fontWeight: '800' }}
          >
            {isLoading ? '⏳ Generating...' : '⚙️ Generate PDF'}
          </button>
          {pdfBlobUrl && (
            <a 
              href={pdfBlobUrl} 
              download={`${grade}-${subject}-${skill}.pdf`}
              style={{ ...toolbarStyle, backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '8px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: '800' }}
            >
              ⬇️ Download PDF
            </a>
          )}
          <button onClick={handlePublish} className="toolbar-btn-success" style={{ ...toolbarStyle, backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '8px 16px', fontWeight: '800' }}>
            🚀 Publish
          </button>
        </div>
      </div>

      {/* ── Core Workspace ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 1. Left Sidebar Navigation */}
        <aside style={{ 
          width: '240px', 
          backgroundColor: '#1e293b', 
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '0 12px 12px 12px', fontSize: '11px', fontWeight: '850', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Workspace Navigation
          </div>
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => showToast(`Navigating to ${item.label}...`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: item.active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: item.active ? '#a5b4fc' : '#cbd5e1',
                fontSize: '14px',
                fontWeight: item.active ? '800' : '600',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!item.active) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.target.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!item.active) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#cbd5e1';
                }
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* 2. Center Panel - Main Authoring Interface */}
        <main style={{ 
          flex: 1.2, 
          padding: '20px 30px', 
          overflowY: 'auto', 
          backgroundColor: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <span style={{ 
              background: 'linear-gradient(135deg, #818cf8, #c084fc)', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '10px', 
              fontWeight: '800', 
              textTransform: 'uppercase'
            }}>
              ✨ AI Generator Dashboard
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: '#ffffff' }}>
              Worksheet Creator
            </h1>
          </div>

          {/* Smart Template Library (Section 2) */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '18px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
              Template Category
            </div>
            
            {/* Category tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
              {Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => {
                const isCatActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    style={{
                      backgroundColor: isCatActive ? '#4f46e5' : '#1e293b',
                      color: isCatActive ? '#ffffff' : '#cbd5e1',
                      border: isCatActive ? '1px solid #6366f1' : '1px solid #334155',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Template sub-selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Select Worksheet Template</label>
              <select
                value={activeTemplateIndex}
                onChange={(e) => loadTemplate(currentCategoryObj.templates[parseInt(e.target.value, 10)], parseInt(e.target.value, 10))}
                style={selectStyle}
              >
                {currentCategoryObj.templates.map((tmpl, idx) => (
                  <option key={idx} value={idx}>{tmpl.name}</option>
                ))}
              </select>
            </div>

            {/* Recommended Template Specs */}
            <div style={{ 
              backgroundColor: '#1e293b', 
              borderRadius: '12px', 
              padding: '12px 16px', 
              border: '1.5px dashed rgba(99, 102, 241, 0.2)',
              fontSize: '12px',
              color: '#94a3b8',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px 16px'
            }}>
              <div>📐 **Recommended Layout**: {currentCategoryObj.templates[activeTemplateIndex]?.recommendedLayout === 2 ? '2 Columns (Compact)' : '1 Column (Standard)'}</div>
              <div>✒️ **Recommended Font**: {currentCategoryObj.templates[activeTemplateIndex]?.recommendedFont}</div>
              <div>📐 **Recommended Spacing**: {currentCategoryObj.templates[activeTemplateIndex]?.recommendedSpacing}</div>
              <div>🎨 **Recommended Illustration**: {currentCategoryObj.templates[activeTemplateIndex]?.recommendedIllustrationStyle}</div>
            </div>
          </div>

          {/* SECTION 3: Structured AI Prompt Builder */}
          <div style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.5)', 
            border: '1px solid rgba(99, 102, 241, 0.15)', 
            borderRadius: '20px', 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff' }}>🧠 AI Prompt Builder</span>
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Define exact specifications or write custom prompt code</span>
              </div>
              <button 
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                style={{
                  backgroundColor: isAdvancedMode ? '#4f46e5' : '#1e293b',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                {isAdvancedMode ? '🛠️ Switch to Builder' : '📝 Switch to Advanced (Raw)'}
              </button>
            </div>

            {/* Prompt Variables Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Variables:</span>
              {['{{GRADE}}', '{{SUBJECT}}', '{{TOPIC}}', '{{SKILL}}'].map((v) => (
                <button
                  key={v}
                  onClick={() => appendVariable(v)}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                  title="Click to insert at the end of the currently active builder input"
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Builder Mode Form */}
            {!isAdvancedMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Learning Goal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8' }}>Learning Goal</label>
                  <input 
                    type="text" 
                    value={learningGoal} 
                    onChange={(e) => setLearningGoal(e.target.value)} 
                    onFocus={() => setActivePromptField('learningGoal')}
                    placeholder="e.g. Master single digit multiplication problems" 
                    style={inputStyle}
                  />
                </div>

                {/* Grid inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Style */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8' }}>Question Style</label>
                    <select value={questionStyle} onChange={(e) => setQuestionStyle(e.target.value)} style={selectStyle}>
                      <option value="Multiple Choice">Multiple Choice (MCQ)</option>
                      <option value="Fill-in-the-blank">Fill-in-the-blank</option>
                      <option value="Short Answer">Short Answer</option>
                      <option value="Word Problems">Word Problems</option>
                      <option value="Tracing & Matching">Tracing & Matching</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8' }}>Difficulty</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={selectStyle}>
                      <option value="Easy">Easy (Foundation)</option>
                      <option value="Medium">Medium (Building)</option>
                      <option value="Hard">Hard (Challenge)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Theme */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8' }}>Theme</label>
                    <input 
                      type="text" 
                      value={theme} 
                      onChange={(e) => setTheme(e.target.value)} 
                      onFocus={() => setActivePromptField('theme')}
                      placeholder="e.g. space expedition, deep ocean, jungle safari" 
                      style={inputStyle}
                    />
                  </div>

                  {/* Characters */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8' }}>Characters</label>
                    <input 
                      type="text" 
                      value={characters} 
                      onChange={(e) => setCharacters(e.target.value)} 
                      onFocus={() => setActivePromptField('characters')}
                      placeholder="e.g. Commander Sarah, Tommy the turtle" 
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Vocab Level */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8' }}>Vocabulary Level</label>
                    <select value={vocabLevel} onChange={(e) => setVocabLevel(e.target.value)} style={selectStyle}>
                      <option value="Beginner">Beginner (Simple words)</option>
                      <option value="Intermediate">Intermediate (Core academic)</option>
                      <option value="Advanced">Advanced (Advanced vocabulary)</option>
                    </select>
                  </div>

                  {/* Real-life Context */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8' }}>Real-life Context</label>
                    <input 
                      type="text" 
                      value={realLifeContext} 
                      onChange={(e) => setRealLifeContext(e.target.value)} 
                      onFocus={() => setActivePromptField('realLifeContext')}
                      placeholder="e.g. going shopping, building a treehouse" 
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Bloom's Level */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8' }}>Bloom's Taxonomy Level</label>
                    <select value={bloomLevel} onChange={(e) => setBloomLevel(e.target.value)} style={selectStyle}>
                      <option value="Remembering">Remembering (Recall)</option>
                      <option value="Understanding">Understanding (Explain)</option>
                      <option value="Applying">Applying (Solve)</option>
                      <option value="Analyzing">Analyzing (Compare)</option>
                      <option value="Evaluating">Evaluating (Appraise)</option>
                      <option value="Creating">Creating (Design)</option>
                    </select>
                  </div>

                  {/* Misconceptions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8' }}>Misconceptions to Target</label>
                    <input 
                      type="text" 
                      value={misconceptions} 
                      onChange={(e) => setMisconceptions(e.target.value)} 
                      onFocus={() => setActivePromptField('misconceptions')}
                      placeholder="e.g. adding denominators in fractions" 
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Teacher Instructions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8' }}>Teacher Instructions</label>
                    <input 
                      type="text" 
                      value={teacherInstructions} 
                      onChange={(e) => setTeacherInstructions(e.target.value)} 
                      onFocus={() => setActivePromptField('teacherInstructions')}
                      placeholder="e.g. Have students read out loud" 
                      style={inputStyle}
                    />
                  </div>

                  {/* Extra Instructions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8' }}>Extra AI Instructions</label>
                    <input 
                      type="text" 
                      value={extraInstructions} 
                      onChange={(e) => setExtraInstructions(e.target.value)} 
                      onFocus={() => setActivePromptField('extraInstructions')}
                      placeholder="e.g. Include dotted lines for answers" 
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Advanced Raw Editor Mode
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '850', color: '#a5b4fc', textTransform: 'uppercase' }}>Advanced Prompt Editor (Raw Code)</label>
                <textarea
                  value={advancedPromptText}
                  onChange={(e) => setAdvancedPromptText(e.target.value)}
                  rows={10}
                  style={{ ...textareaStyle, border: '1.5px solid #6366f1', fontSize: '13px' }}
                />
              </div>
            )}

            {/* Live Prompt Preview */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>👁️ Live Prompt Preview</span>
                <button 
                  onClick={handleSavePromptConfig}
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#a5b4fc',
                    border: 'none',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '9px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  ⭐ Save Prompt Config
                </button>
              </div>
              <pre style={{
                margin: 0,
                fontSize: '11px',
                color: '#94a3b8',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                maxHeight: '120px',
                overflowY: 'auto',
                lineHeight: '1.4'
              }}>
                {compilePrompt()}
              </pre>
            </div>

            {/* Saved Prompts & History (Side-by-Side) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
              {/* Saved */}
              <div>
                <span style={{ fontWeight: '800', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Saved Prompt Configurations</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '70px', overflowY: 'auto' }}>
                  {savedPrompts.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadSavedPrompt(s)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6366f1',
                        textAlign: 'left',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '11px',
                        fontWeight: '700',
                        textDecoration: 'underline'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                  {savedPrompts.length === 0 && <span style={{ color: '#64748b' }}>No saved prompts.</span>}
                </div>
              </div>

              {/* History */}
              <div>
                <span style={{ fontWeight: '800', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Prompt History (Recent)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '70px', overflowY: 'auto' }}>
                  {promptHistory.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isAdvancedMode) setAdvancedPromptText(p);
                        else {
                          // Try restoring variables or load in advanced mode
                          setIsAdvancedMode(true);
                          setAdvancedPromptText(p);
                        }
                        showToast('Restored prompt from history!');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        textAlign: 'left',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '11px',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        width: '180px'
                      }}
                      title={p}
                    >
                      📜 {p.slice(0, 30)}...
                    </button>
                  ))}
                  {promptHistory.length === 0 && <span style={{ color: '#64748b' }}>No history yet.</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Authoring settings form */}
          <div style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.7)', 
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px', 
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8', textTransform: 'uppercase' }}>Grade Level</label>
                <select 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  style={selectStyle}
                >
                  <option value="lkg">LKG (Lower Kindergarten)</option>
                  <option value="ukg">UKG (Upper Kindergarten)</option>
                  <option value="prek">Pre-K</option>
                  <option value="grade-1">Grade 1</option>
                  <option value="grade-2">Grade 2</option>
                  <option value="grade-6">Grade 6</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8', textTransform: 'uppercase' }}>Subject Area</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={selectStyle}
                >
                  <option value="math">Mathematics</option>
                  <option value="english">English Reading/Grammar</option>
                  <option value="physics">Physics (Science)</option>
                  <option value="science">Science (General)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8', textTransform: 'uppercase' }}>Topic Segment Slug</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. english-reading-foundations"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8', textTransform: 'uppercase' }}>Skill Target ID</label>
                <input 
                  type="text" 
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  placeholder="e.g. eng-short-u-find"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Typographical Customizations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8', textTransform: 'uppercase' }}>Worksheet Font</label>
                <select value={font} onChange={(e) => setFont(e.target.value)} style={selectStyle}>
                  <option value="Outfit">Outfit (Clean)</option>
                  <option value="Playpen Sans">Playpen Sans (Fun)</option>
                  <option value="Inter">Inter (Sleek)</option>
                  <option value="Comic Neue">Comic Neue (School)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8', textTransform: 'uppercase' }}>Worksheet Spacing</label>
                <select value={spacing} onChange={(e) => setSpacing(e.target.value)} style={selectStyle}>
                  <option value="compact">Compact (A4 Single page)</option>
                  <option value="standard">Standard (Relaxed)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8', textTransform: 'uppercase' }}>Illustration style</label>
                <input 
                  type="text" 
                  value={illustrationStyle} 
                  onChange={(e) => setIllustrationStyle(e.target.value)} 
                  placeholder="e.g. cartoon outlines" 
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8', textTransform: 'uppercase' }}>Worksheet Layout Columns</label>
                <select 
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value, 10))}
                  style={selectStyle}
                >
                  <option value={1}>1 Column (Standard)</option>
                  <option value={2}>2 Columns (Compact side-by-side)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '850', color: '#94a3b8', textTransform: 'uppercase' }}>Append Teacher Answer Key</label>
                <select 
                  value={includeAnswers ? 'true' : 'false'}
                  onChange={(e) => setIncludeAnswers(e.target.value === 'true')}
                  style={selectStyle}
                >
                  <option value="true">Include Solutions & Explanations</option>
                  <option value="false">No Answer Key</option>
                </select>
              </div>
            </div>

            {error && (
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                color: '#fca5a5', 
                borderRadius: '10px', 
                padding: '12px', 
                fontSize: '13px',
                fontWeight: '600'
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        </main>

        {/* 3. Right Panel - Live Preview Frame */}
        <section style={{ 
          flex: 1.5, 
          backgroundColor: '#1e293b', 
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              gap: '20px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div className="spinner" style={{
                width: '50px',
                height: '50px',
                border: '4px solid #334155',
                borderTopColor: '#818cf8',
                borderRadius: '50%',
                animation: 'spin 1.2s cubic-bezier(0.5, 0.1, 0.1, 0.9) infinite'
              }}></div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>
                Designing Worksheet with Gemini AI
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '300px', lineHeight: '1.4' }}>
                Asking AI to write custom questions, drafting clean layout structure, and rendering printable vector PDF via Puppeteer...
              </div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : pdfBlobUrl ? (
            <iframe 
              src={pdfBlobUrl} 
              title="PDF Worksheet Preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#64748b',
              padding: '40px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '56px', marginBottom: '16px' }}>📄</span>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#cbd5e1' }}>
                Live Workspace Preview
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '280px', marginTop: '8px', lineHeight: '1.4' }}>
                Configure curriculum variables on the left, then click **Generate PDF** in the top toolbar to render the layout.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ── Toast Notifications ── */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1e1b4b',
          color: '#c7d2fe',
          border: '1.5px solid #4f46e5',
          boxShadow: '0 8px 30px rgba(99, 102, 241, 0.3)',
          padding: '12px 24px',
          borderRadius: '14px',
          fontSize: '14px',
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 100000,
          animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <span>🔔</span> {toast}
          <style>{`
            @keyframes fadeUp {
              from { transform: translate(-50%, 20px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

const toolbarStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  color: '#cbd5e1',
  padding: '6px 12px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  outline: 'none'
};

const selectStyle = {
  backgroundColor: '#0f172a', 
  color: '#ffffff', 
  border: '1.5px solid #334155', 
  borderRadius: '10px', 
  padding: '10px 12px', 
  fontSize: '13px',
  fontWeight: '600',
  outline: 'none',
  fontFamily: 'Outfit, sans-serif'
};

const inputStyle = {
  backgroundColor: '#0f172a', 
  color: '#ffffff', 
  border: '1.5px solid #334155', 
  borderRadius: '10px', 
  padding: '10px 12px', 
  fontSize: '13px',
  fontWeight: '600',
  outline: 'none',
  fontFamily: 'Outfit, sans-serif'
};

const textareaStyle = {
  backgroundColor: '#0f172a', 
  color: '#ffffff', 
  border: '1.5px solid #334155', 
  borderRadius: '10px', 
  padding: '10px 12px', 
  fontSize: '13px',
  fontWeight: '600',
  outline: 'none',
  resize: 'none',
  fontFamily: 'Outfit, sans-serif'
};
