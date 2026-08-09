'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import { formatPracticeUrl } from '@/lib/curriculum/urlHelpers';

export default function UnlimitedPracticeCatalogPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = React.use(params);
  const examId = resolvedParams.examId;

  const initialSection = searchParams.get('section') || 'mat';
  const initialMode = searchParams.get('mode') || 'unlimited'; // 'unlimited' | 'mock-tests' | 'pyq'

  const [session, setSession] = useState(null);
  const [exam, setExam] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mainTab, setMainTab] = useState(initialMode);
  const [activeTab, setActiveTab] = useState(initialSection);
  const [viewBy, setViewBy] = useState('topics');
  const [devMode, setDevMode] = useState(searchParams.get('dev') === 'true');
  const [templates, setTemplates] = useState([]);
  const [dbMockTests, setDbMockTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Restore saved active section tab from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const querySec = searchParams.get('section');
    const savedSec = sessionStorage.getItem(`jnvst_${examId}_active_section`);
    const targetSec = querySec || savedSec;
    if (targetSec && targetSec !== activeTab) {
      setActiveTab(targetSec);
    }
  }, [examId, searchParams]);

  // Section Tab Handler with sessionStorage and URL sync
  const handleSectionChange = (secId) => {
    setActiveTab(secId);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`jnvst_${examId}_active_section`, secId);
      const url = new URL(window.location.href);
      url.searchParams.set('section', secId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Save vertical scroll position on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timer = null;
    const handleScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (window.scrollY > 0) {
          sessionStorage.setItem(`jnvst_${examId}_scroll_pos`, window.scrollY.toString());
        }
      }, 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [examId]);

  // Restore vertical scroll position after topics finish loading
  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      const savedScroll = sessionStorage.getItem(`jnvst_${examId}_scroll_pos`);
      if (savedScroll) {
        const scrollY = parseInt(savedScroll, 10);
        if (!isNaN(scrollY) && scrollY > 0) {
          setTimeout(() => {
            window.scrollTo({ top: scrollY, behavior: 'instant' });
          }, 80);
        }
      }
    }
  }, [loading, activeTab, examId]);

  useEffect(() => {
    async function loadUserAndData() {
      try {
        const sessRes = await fetch('/api/auth/session');
        const sessData = await sessRes.json();
        const activeUserId = sessData.success && sessData.authenticated ? sessData.session.userId : 'guest_child';
        setSession({ userId: activeUserId, name: sessData.session?.name || 'Rahul' });

        const examRes = await fetch(`/api/exams/${examId}?userId=${activeUserId}`);
        const examData = await examRes.json();
        if (examData.success) {
          setExam(examData.exam);
          setProfile(examData.profile || null);
        }

        const templatesRes = await fetch(`/api/admin/templates?examId=${examId}`);
        const templatesData = await templatesRes.json();
        if (templatesData.success) {
          setTemplates(templatesData.templates || []);
        }

        const seriesRes = await fetch(`/api/admin/test-series?examId=${examId}`);
        const seriesData = await seriesRes.json();
        if (seriesData.success) {
          const loadedTests = [];
          if (Array.isArray(seriesData.testSeries)) {
            seriesData.testSeries.forEach(series => {
              if (Array.isArray(series.tests)) {
                series.tests.forEach(test => {
                  loadedTests.push({
                    id: test.mockTestId,
                    templateId: test.mockTestId,
                    title: test.title || 'Full Mock Test',
                    tag: series.title || 'TEST SERIES',
                    tagBg: '#6366f1',
                    duration: `${test.durationMinutes || 120} Mins`,
                    questions: `${test.totalQuestions || 80} Questions`,
                    marks: `${test.totalMarks || 100} Marks`,
                    cutoff: '65 Marks',
                    desc: `Practice under timed conditions. Part of the ${series.title} test series.`
                  });
                });
              }
            });
          }
          setDbMockTests(loadedTests);
        }
      } catch (err) {
        console.error("Failed to load catalog data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUserAndData();
  }, [examId]);

  const activeSectionObj = exam?.sections?.find(s => s.id === activeTab) || exam?.sections?.[0];

  const formatTopicName = (topicId) => {
    if (!topicId) return '';
    return topicId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Mock Tests Catalog Data
  const mockTestsList = [
    {
      id: 'mock-1',
      templateId: 'jnvst-official-mock-test-1',
      title: 'JNVST Official Full Selection Mock Test 1',
      tag: 'LIVE SELECTION MODE',
      tagBg: '#22c55e',
      duration: '120 Mins',
      questions: '80 Questions',
      marks: '100 Marks',
      cutoff: '65 Marks',
      desc: 'Simulate the exact Jawahar Navodaya 80-question exam with timed sections (Mental Ability, Arithmetic & Language) and real-time selection cutoff analysis.'
    },
    {
      id: 'mock-2',
      templateId: 'jnvst-official-mock-test-2',
      title: 'JNVST Official Full Selection Mock Test 2',
      tag: 'EXAM SIMULATOR',
      tagBg: '#6366f1',
      duration: '120 Mins',
      questions: '80 Questions',
      marks: '100 Marks',
      cutoff: '68 Marks',
      desc: 'Full length mock test focusing on high-difficulty figure series and speed arithmetic calculations.'
    },
    {
      id: 'mock-3',
      templateId: 'jnvst-official-mock-test-3',
      title: 'JNVST District Level Predictor Test 3',
      tag: 'PREDICTOR MODE',
      tagBg: '#a855f7',
      duration: '120 Mins',
      questions: '80 Questions',
      marks: '100 Marks',
      cutoff: '70 Marks',
      desc: 'State & district level competitive ranking test with deep diagnostic score breakdowns.'
    }
  ];

  // PYQs Archive Catalog Data
  const pyqList = [
    {
      year: '2025',
      templateId: '2025-jnvst-official-pyq-template',
      title: 'JNVST Official Selection Paper 2025',
      date: 'Conducted 18 Jan 2025',
      questions: '80 Questions',
      tag: 'LATEST OFFICIAL PAPER',
      desc: 'Official 2025 Class 6 entrance paper (Test Booklet SS256J Code B) held on 18th January 2025 with complete answer key explanations.'
    },
    {
      year: '2024',
      templateId: '2024-jnvst-official-pyq-template',
      title: 'JNVST Official Selection Paper 2024',
      date: 'Conducted Jan 2024',
      questions: '80 Questions',
      tag: 'OFFICIAL PAST PAPER',
      desc: 'Authentic Jawahar Navodaya Class 6 entrance paper with official answer key explanations.'
    },
    {
      year: '2023',
      templateId: '2023-jnvst-official-pyq-template',
      title: 'JNVST Official Selection Paper 2023',
      date: 'Conducted Apr 2023',
      questions: '80 Questions',
      tag: 'OFFICIAL PAST PAPER',
      desc: 'Complete 2023 selection exam covering 40 MAT, 20 Arithmetic, and 20 Language comprehension questions.'
    },
    {
      year: '2022',
      templateId: '2022-jnvst-official-pyq-template',
      title: 'JNVST Official Selection Paper 2022',
      date: 'Conducted Apr 2022',
      questions: '80 Questions',
      tag: 'OFFICIAL PAST PAPER',
      desc: 'Previous year paper with topic-wise breakdown and step-by-step solution keys.'
    },
    {
      year: '2020',
      templateId: '2020-jnvst-official-pyq-template',
      title: 'JNVST Official Selection Paper 2020',
      date: 'Conducted Jan 2020',
      questions: '80 Questions',
      tag: 'OFFICIAL PAST PAPER',
      desc: 'Historical selection test paper for fundamental concept practice and pattern analysis.'
    },
    {
      year: '2019',
      templateId: '2019-jnvst-official-pyq-template',
      title: 'JNVST Official Selection Paper 2019',
      date: 'Conducted Apr 2019',
      questions: '80 Questions',
      tag: 'OFFICIAL PAST PAPER',
      desc: 'Official 2019 selection test paper with complete 80 questions.'
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#ffffff' }}>
        <div style={{ fontSize: '18px', fontWeight: '800', color: '#16a34a' }}>Loading Practice Catalog...</div>
      </div>
    );
  }

  return (
    <div className="ixl-catalog-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .ixl-catalog-wrapper {
          min-height: 100vh;
          background: #ffffff;
          font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1e293b;
        }

        /* Top Header Navbar */
        .ixl-top-nav {
          background: #ffffff;
          border-bottom: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 64px;
        }

        .main-tab-bar {
          display: flex;
          align-items: center;
          gap: 24px;
          height: 100%;
        }

        .main-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 100%;
          padding: 0 12px;
          font-size: 16px;
          font-weight: 800;
          color: #64748b;
          cursor: pointer;
          border-bottom: 4px solid transparent;
          background: transparent;
          border-top: none;
          border-left: none;
          border-right: none;
          transition: all 0.2s ease;
        }

        .main-tab-btn:hover {
          color: #16a34a;
        }

        .main-tab-btn.active {
          color: #16a34a;
          border-bottom-color: #16a34a;
        }

        /* Sub-Tabs Section Bar */
        .ixl-sub-nav-bar {
          background: #f8fafc;
          border-bottom: 1.5px solid #e2e8f0;
          padding: 12px 40px;
          display: flex;
          align-items: center;
          gap: 16px;
          overflow-x: auto;
        }

        .sub-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 800;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .sub-tab-btn:hover {
          border-color: #16a34a;
          color: #16a34a;
        }

        .sub-tab-btn.active {
          background: #22c55e;
          color: #ffffff;
          border-color: #16a34a;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .ixl-view-pill {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 5px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ixl-view-pill.active {
          background: #38bdf8;
          color: #ffffff;
          border-color: #0284c7;
        }

        /* Main Catalog Content Container */
        .ixl-main-container {
          max-width: 1360px;
          margin: 0 auto;
          padding: 32px 40px;
        }

        .ixl-category-title {
          font-size: 34px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .ixl-category-sub {
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
          margin: 0 0 32px 0;
          max-width: 960px;
        }

        /* IXL 3-Column Skills Grid */
        .ixl-skills-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 36px 32px;
        }

        @media (max-width: 1024px) {
          .ixl-skills-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .ixl-skills-grid {
            grid-template-columns: 1fr;
          }
        }

        .ixl-topic-box {
          display: flex;
          flex-direction: column;
        }

        .ixl-topic-heading {
          font-size: 19px;
          font-weight: 900;
          color: #16a34a;
          margin: 0 0 14px 0;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 2px solid #dcfce7;
          padding-bottom: 6px;
        }

        .ixl-skill-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ixl-skill-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: #334155;
          text-decoration: none;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 6px;
          transition: background 0.15s ease;
        }

        .ixl-skill-item:hover {
          background: #f0fdf4;
        }

        .ixl-skill-item:hover .ixl-skill-text {
          color: #16a34a;
          text-decoration: underline;
        }

        .ixl-skill-code {
          font-size: 13px;
          font-weight: 900;
          color: #0f172a;
          flex-shrink: 0;
          min-width: 32px;
        }

        .ixl-skill-text {
          font-weight: 600;
          color: #334155;
          line-height: 1.4;
        }

        .ixl-practice-badge-btn {
          margin-left: auto;
          background: #22c55e;
          color: #ffffff;
          border: none;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          opacity: 0;
          transition: opacity 0.15s ease;
          flex-shrink: 0;
        }

        .ixl-skill-item:hover .ixl-practice-badge-btn {
          opacity: 1;
        }

        /* Mock Test & PYQ Cards */
        .catalog-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          transition: all 0.2s ease;
        }

        .catalog-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }
      ` }} />

      {/* Top Navbar Header */}
      <nav className="ixl-top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', height: '100%' }}>
          <Link href={`/exam-prep/${examId}`} style={{ textDecoration: 'none', color: '#6366f1', fontWeight: 800, fontSize: '14px' }}>
            ← Dashboard
          </Link>
          <div style={{ height: '24px', width: '1px', background: '#cbd5e1' }} />
          
          <div className="main-tab-bar">
            <button
              className={`main-tab-btn ${mainTab === 'unlimited' ? 'active' : ''}`}
              onClick={() => setMainTab('unlimited')}
            >
              <span>♾️</span>
              <span>Unlimited Practice</span>
            </button>

            <button
              className={`main-tab-btn ${mainTab === 'mock-tests' ? 'active' : ''}`}
              onClick={() => setMainTab('mock-tests')}
            >
              <span>🏆</span>
              <span>Full Mock Tests</span>
            </button>

            <button
              className={`main-tab-btn ${mainTab === 'pyq' ? 'active' : ''}`}
              onClick={() => setMainTab('pyq')}
            >
              <span>📄</span>
              <span>Previous Year Papers</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>


          <div style={{ fontSize: '13px', fontWeight: '800', color: '#16a34a', background: '#dcfce7', padding: '6px 14px', borderRadius: '20px' }}>
            JNVST Syllabus
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="breadcrumb-bar" style={{ background: '#f8fafc', padding: '10px 40px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#64748b' }}>Home</Link>
          <span>›</span>
          <Link href={`/exam-prep/${examId}`} style={{ textDecoration: 'none', color: '#64748b' }}>JNVST Prep</Link>
          <span>›</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>
            {mainTab === 'unlimited' ? 'Unlimited Practice' : mainTab === 'mock-tests' ? 'Full Mock Tests' : 'Previous Year Papers'}
          </span>
        </div>
      </div>

      {/* Sub-Tabs Section Bar (Under Unlimited Practice) */}
      {mainTab === 'unlimited' && (
        <div className="ixl-sub-nav-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 40px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflowX: 'auto' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', marginRight: '2px' }}>Sections:</span>
            {exam?.sections
              ?.filter(sec => sec.id !== 'previous-papers')
              ?.map((sec) => {
                const isActive = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    className={`sub-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleSectionChange(sec.id)}
                  >
                    <span style={{ fontSize: '16px' }}>{sec.icon || '📝'}</span>
                    <span>{sec.name}</span>
                  </button>
                );
              })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>View by:</span>
            <button 
              className={`ixl-view-pill ${viewBy === 'topics' ? 'active' : ''}`}
              onClick={() => setViewBy('topics')}
            >
              Topics
            </button>
            <button 
              className={`ixl-view-pill ${viewBy === 'classes' ? 'active' : ''}`}
              onClick={() => setViewBy('classes')}
            >
              Classes
            </button>
          </div>
        </div>
      )}

      {/* Main Content Canvas */}
      <main className="ixl-main-container">
        {/* MODE 1: UNLIMITED PRACTICE (DYNAMICALLY LOADED ADMIN SKILLS) */}
        {mainTab === 'unlimited' && (() => {
          // Filter custom templates for current section (mat, arithmetic, language) and difficulty
          const sectionTemplates = templates.filter(t => {
            const sec = String(t.section || t.subject || '').toLowerCase().trim();
            const currentTab = activeTab.toLowerCase();
            const matchesSection = sec === currentTab || (currentTab === 'mat' && (sec === 'mat' || sec === 'mental ability'));
            if (!matchesSection) return false;

            // Difficulty filter
            if (difficultyFilter !== 'all') {
              const diff = Number(t.difficulty) || 0.5;
              if (difficultyFilter === 'easy' && diff > 0.35) return false;
              if (difficultyFilter === 'medium' && (diff <= 0.35 || diff > 0.65)) return false;
              if (difficultyFilter === 'hard' && diff <= 0.65) return false;
            }

            return true;
          });

          // Group custom templates by topic
          const topicMap = {};
          sectionTemplates.forEach(t => {
            const topicKey = t.topic || 'General Practice';
            if (!topicMap[topicKey]) topicMap[topicKey] = [];
            topicMap[topicKey].push(t);
          });

          const topicKeys = Object.keys(topicMap);

          // Apply Search Term Filter
          const filteredTopicKeys = topicKeys.filter(topicId => {
            const cleanTopic = formatTopicName(topicId).toLowerCase();
            const cleanSearch = searchTerm.toLowerCase();
            if (cleanTopic.includes(cleanSearch)) return true;

            const skillItems = topicMap[topicId];
            return skillItems.some(skill => {
              const title = (skill.name || skill.title || '').toLowerCase();
              return title.includes(cleanSearch);
            });
          });

          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
                <h1 className="ixl-category-title" style={{ margin: 0 }}>
                  {activeSectionObj?.name || 'Mental Ability Test'}
                </h1>
              </div>

              <p className="ixl-category-sub">
                Select any topic or micro-skill below to launch unlimited interactive practice questions.
              </p>

              {/* Search & Difficulty Filter Bar */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px', display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                  <span style={{ fontSize: '16px', color: '#64748b' }}>🔍</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search topics or micro-skills..."
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: 600, color: '#1e293b', outline: 'none' }}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748b' }}>Difficulty:</span>
                  <select
                    value={difficultyFilter}
                    onChange={e => setDifficultyFilter(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="all">All Levels</option>
                    <option value="easy">Beginner (Easy)</option>
                    <option value="medium">Intermediate (Medium)</option>
                    <option value="hard">Advanced (Hard)</option>
                  </select>
                </div>
              </div>

              {topicKeys.length === 0 ? (
                <div style={{
                  background: '#f8fafc',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  maxWidth: '700px',
                  margin: '40px auto'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
                  <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                    No custom skills are available yet.
                  </h3>
                </div>
              ) : filteredTopicKeys.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px 0' }}>No matching topics found</h4>
                  <p style={{ fontSize: '14px', margin: 0 }}>Try modifying your search or difficulty filters.</p>
                </div>
              ) : (
                <div className="ixl-skills-grid">
                  {filteredTopicKeys.map((topicId, topicIdx) => {
                    const topicCodeLetter = String.fromCharCode(65 + topicIdx); // A, B, C, D...
                    const skillItems = topicMap[topicId];
                    const topicMasteryObj = profile?.topicMastery?.[topicId] || null;

                    return (
                      <div key={topicId} className="ixl-topic-box">
                        <h2 className="ixl-topic-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span>{formatTopicName(topicId)}</span>
                          {topicMasteryObj && (
                            <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                              🎯 {topicMasteryObj.score || topicMasteryObj.smartScore || 0}% Mastery
                            </span>
                          )}
                        </h2>

                        <div className="ixl-skill-list">
                          {skillItems.map((skill, skillIdx) => {
                            const skillCode = `${topicCodeLetter}.${skillIdx + 1}`;
                            const skillTitle = skill.name || skill.title || `${formatTopicName(topicId)} Skill ${skillIdx + 1}`;
                            const skillMastery = profile?.topicMastery?.[skill.id] || null;
                            const isDevMode = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

                            return (
                              <Link 
                                key={skill.id || skillIdx}
                                className="ixl-skill-item"
                                href={formatPracticeUrl({ examId, section: activeTab, topicId, skillId: skill.id, userId: session?.userId })}
                                onClick={() => {
                                  if (typeof window !== 'undefined') {
                                    sessionStorage.setItem(`jnvst_${examId}_scroll_pos`, window.scrollY.toString());
                                    sessionStorage.setItem(`jnvst_${examId}_active_section`, activeTab);
                                  }
                                }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textDecoration: 'none', color: 'inherit' }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                  <span className="ixl-skill-code">{skillCode}</span>
                                  <span className="ixl-skill-text">{skillTitle}</span>
                                  {skillMastery && (
                                    <span style={{ fontSize: '11px', background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: '8px', fontWeight: 800, marginLeft: '6px' }}>
                                      {skillMastery.score || 0}%
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {isDevMode && (
                                    <span
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (typeof window !== 'undefined') {
                                          window.open(`/exam-prep-grid?templateId=${encodeURIComponent(skill.id)}`, '_blank');
                                        }
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        color: '#2563eb',
                                        background: '#eff6ff',
                                        border: '1.5px solid #bfdbfe',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                      }}
                                      title="Open and edit this template directly in Spreadsheet Editor"
                                    >
                                      📊 Edit in Spreadsheet
                                    </span>
                                  )}
                                  <span className="ixl-practice-badge-btn">Practice ▶</span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* MODE 2: MOCK TESTS CATALOG LIST */}
        {mainTab === 'mock-tests' && (
          <>
            <h1 className="ixl-category-title" style={{ color: '#6366f1' }}>
              🏆 JNVST Full Selection Mock Tests
            </h1>
            <p className="ixl-category-sub">
              Select a full-length 80-question mock test below to simulate real Jawahar Navodaya exam conditions with timed section switches and cutoff analysis.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(dbMockTests.length > 0 ? dbMockTests : mockTestsList).map((test) => (
                <div key={test.id} className="catalog-card">
                  <div style={{ maxWidth: '800px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ background: test.tagBg || '#6366f1', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                        {test.tag}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                        ⏱️ {test.duration} · 📝 {test.questions} · 💯 {test.marks}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
                      {test.title}
                    </h2>
                    <p style={{ color: '#475569', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                      {test.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/exam-prep/${examId}/mock-test?templateId=${test.templateId || 'jnvst-official-mock-test-1'}`)}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px 28px',
                      borderRadius: '14px',
                      fontWeight: '800',
                      fontSize: '15px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🚀 Launch Test →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* MODE 3: PREVIOUS YEAR PAPERS (PYQ ARCHIVE CATALOG) */}
        {mainTab === 'pyq' && (
          <>
            <h1 className="ixl-category-title" style={{ color: '#0284c7' }}>
              📄 Previous Year Papers (PYQ Archive)
            </h1>
            <p className="ixl-category-sub">
              Practice official historical JNVST selection papers (2018–2024) to analyze recurring exam patterns and master real questions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {pyqList.map((pyq) => (
                <div key={pyq.year} className="catalog-card">
                  <div style={{ maxWidth: '800px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ background: '#0284c7', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                        {pyq.tag}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                        📅 {pyq.date} · 📝 {pyq.questions}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
                      {pyq.title}
                    </h2>
                    <p style={{ color: '#475569', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                      {pyq.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/exam-prep/${examId}/mock-test?templateId=${pyq.templateId}`)}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px 28px',
                      borderRadius: '14px',
                      fontWeight: '800',
                      fontSize: '15px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ▶️ Practice PYQ →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
