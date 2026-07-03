'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '../../../components/layout/SiteHeader';
import PracticeGate from '../../../components/exam/PracticeGate';

export default function JnvstDashboard({ params }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const examId = resolvedParams.examId;

  const [session, setSession] = useState(null);
  const [exam, setExam] = useState(null);
  const [profile, setProfile] = useState(null);
  const [gateStatus, setGateStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedGateSection, setSelectedGateSection] = useState(null);
  const [showGate, setShowGate] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [templates, setTemplates] = useState([]);
  const [expandedTopics, setExpandedTopics] = useState({});

  const toggleTopic = (topicId) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  // Set default active tab once exam sections load
  useEffect(() => {
    if (exam?.sections?.length > 0 && !activeTab) {
      setActiveTab(exam.sections[0].id);
    }
  }, [exam, activeTab]);

  // 1. Load User Session
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        const activeUserId = data.success && data.authenticated ? data.session.userId : 'guest_child';
        setSession({ userId: activeUserId, name: data.success && data.authenticated ? data.session.name : 'Guest Student' });
      } catch (err) {
        setSession({ userId: 'guest_child', name: 'Guest Student' });
      }
    }
    loadUser();
  }, []);

  // 2. Load exam details, templates & User Profile once session is loaded
  useEffect(() => {
    if (!session || !examId) return;

    async function loadData() {
      try {
        // Fetch exam and profile
        const res = await fetch(`/api/exams/${examId}?userId=${session.userId}`);
        const data = await res.json();
        if (data.success) {
          setExam(data.exam);
          setProfile(data.profile);
          
          // Check limits dynamically for all sections of this exam
          const gateStatuses = {};
          if (data.exam && data.exam.sections) {
            for (const section of data.exam.sections) {
              try {
                const gateRes = await fetch(`/api/practice/gate?examId=${examId}&section=${section.id}&userId=${session.userId}`);
                const gateData = await gateRes.json();
                gateStatuses[section.id] = gateData.success ? gateData : { allowed: true };
              } catch (e) {
                gateStatuses[section.id] = { allowed: true };
              }
            }
          }
          setGateStatus(gateStatuses);
        }

        // Fetch templates
        const templatesRes = await fetch(`/api/admin/templates?examId=${examId}`);
        const templatesData = await templatesRes.json();
        if (templatesData.success) {
          setTemplates(templatesData.templates || []);
        }

      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session, examId]);

  const handleStartSection = (sectionId, sectionName) => {
    const isAllowed = gateStatus[sectionId]?.allowed !== false;
    if (!isAllowed) {
      setSelectedGateSection({ id: sectionId, name: sectionName });
      setShowGate(true);
    } else {
      router.push(`/exam-prep/${examId}/practice/${sectionId}?userId=${session?.userId || 'guest_child'}`);
    }
  };

  const handleStartTopic = (sectionId, sectionName, topicId) => {
    const isAllowed = gateStatus[sectionId]?.allowed !== false;
    if (!isAllowed) {
      setSelectedGateSection({ id: sectionId, name: sectionName });
      setShowGate(true);
    } else {
      router.push(`/exam-prep/${examId}/practice/${sectionId}?userId=${session?.userId || 'guest_child'}&topic=${topicId}`);
    }
  };

  const handleStartTemplate = (sectionId, sectionName, topicId, templateId) => {
    const isAllowed = gateStatus[sectionId]?.allowed !== false;
    if (!isAllowed) {
      setSelectedGateSection({ id: sectionId, name: sectionName });
      setShowGate(true);
    } else {
      router.push(`/exam-prep/${examId}/practice/${sectionId}?userId=${session?.userId || 'guest_child'}&topic=${topicId}&templateId=${templateId}`);
    }
  };

  const formatTopicName = (topicId) => {
    if (!topicId) return '';
    return topicId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTopicPrefix = (sectionId, index) => {
    const sec = exam?.sections?.find(s => s.id === sectionId);
    const char = sec ? (sec.shortName || sec.name || 'S').charAt(0).toUpperCase() : 'S';
    return `${char}.${index + 1}`;
  };

  if (loading) {
    return (
      <div className="loader-container">
        <style dangerouslySetInnerHTML={{ __html: `
          .loader-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f8fafc;
            font-family: var(--font-outfit), sans-serif;
          }
          .spinner {
            border: 4px solid #e2e8f0;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border-left-color: #6366f1;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        ` }} />
        <div className="spinner"></div>
      </div>
    );
  }

  // Calculate estimated overall score: mapping average theta (0.05-0.95) to 0-100
  const matTheta = profile?.sectionTheta?.mat ?? 0.5;
  const arithTheta = profile?.sectionTheta?.arithmetic ?? 0.5;
  const langTheta = profile?.sectionTheta?.language ?? 0.5;
  const avgTheta = (matTheta + arithTheta + langTheta) / 3;
  const overallScore = Math.round(((avgTheta - 0.05) / 0.9) * 100);

  const weakTopics = profile?.weakTopics || [];
  const strongTopics = profile?.strongTopics || [];
  const activeSectionObj = exam?.sections?.find(s => s.id === activeTab);

  return (
    <div className="jnvst-dashboard">
      <style dangerouslySetInnerHTML={{ __html: `
        .jnvst-dashboard {
          min-height: 100vh;
          background: #f8fafc;
          font-family: var(--font-outfit), 'Inter', sans-serif;
          color: #0f172a;
        }

        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 40px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          color: #64748b;
          text-decoration: none;
          font-weight: 700;
          font-size: 15px;
          transition: color 0.2s;
          margin-bottom: 12px;
        }

        .back-link:hover {
          color: #4f46e5;
        }

        .header-title {
          font-size: 36px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .header-subtitle {
          font-size: 16px;
          color: #64748b;
          margin-top: 4px;
        }

        .grid-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 32px;
        }

        @media (max-width: 960px) {
          .grid-layout {
            grid-template-columns: 1fr;
          }
        }

        .section-tabs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .section-tab {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .section-tab:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .section-tab.active {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.25);
        }

        .tab-icon {
          font-size: 28px;
          background: #f1f5f9;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .section-tab.active .tab-icon {
          background: rgba(255, 255, 255, 0.2);
        }

        .tab-info {
          display: flex;
          flex-direction: column;
        }

        .tab-name {
          font-size: 15px;
          font-weight: 800;
          line-height: 1.2;
          color: #1e293b;
        }

        .section-tab.active .tab-name {
          color: white;
        }

        .tab-rating {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          margin-top: 4px;
        }

        .section-tab.active .tab-rating {
          color: rgba(255, 255, 255, 0.9);
        }

        .active-section-header {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .active-section-title {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .active-section-desc {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .skills-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        .skill-list-item {
          display: flex;
          flex-direction: column;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px 24px;
          transition: all 0.2s ease;
        }

        .skill-list-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.02);
        }

        .topic-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .micro-skills-container {
          border-top: 1px solid #f1f5f9;
          margin-top: 14px;
          padding-top: 12px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .micro-skill-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: 10px;
          font-size: 14px;
          border: 1px solid #f1f5f9;
          transition: background 0.15s, border-color 0.15s;
        }

        .micro-skill-row:hover {
          background: #f1f5f9;
          border-color: #e2e8f0;
        }

        .micro-skill-name {
          font-weight: 700;
          color: #334155;
        }

        .btn-micro-practice {
          background: #6366f1;
          color: white;
          border: none;
          font-size: 11.5px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-micro-practice:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        .skill-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-grow: 1;
        }

        .skill-index {
          font-weight: 800;
          color: #6366f1;
          font-size: 13px;
          min-width: 36px;
          background: #f1f5f9;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }

        .skill-name-link {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          cursor: pointer;
          transition: color 0.15s;
        }

        .skill-name-link:hover {
          color: #4f46e5;
          text-decoration: underline;
        }

        .skill-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .skill-score-badge {
          font-size: 12px;
          background: #e0e7ff;
          color: #3730a3;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 700;
        }

        .btn-skill-practice {
          background: #6366f1;
          color: white;
          border: none;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-skill-practice:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        .btn-skill-lock {
          background: #f8fafc;
          color: #b45309;
          border: 1px dashed #fde68a;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 13px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-skill-lock:hover {
          background: #fef3c7;
        }

        @media (max-width: 768px) {
          .skills-list {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        .btn-section-action {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.15);
        }

        .btn-section-action:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .btn-locked {
          background: #f1f5f9;
          color: #b45309;
          border: 1px dashed #fde68a;
          box-shadow: none;
        }

        .sidebar-panel {
          background: white;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 32px;
          height: fit-content;
        }

        .score-circle-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
          text-align: center;
        }

        .score-circle {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: conic-gradient(#6366f1 var(--score-deg), #f1f5f9 0deg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 8px 16px rgba(99, 102, 241, 0.1);
        }

        .score-inner {
          width: 116px;
          height: 116px;
          border-radius: 50%;
          background: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-num {
          font-size: 36px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1;
        }

        .score-max {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 700;
          margin-top: 2px;
        }

        .score-status {
          font-size: 15px;
          font-weight: 800;
          color: #4f46e5;
          margin-top: 4px;
        }

        .topics-list-container {
          border-top: 1px solid #f1f5f9;
          padding-top: 24px;
        }

        .topics-list-title {
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 16px;
          color: #334155;
        }

        .topic-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          margin-right: 8px;
          margin-bottom: 8px;
        }

        .pill-strong {
          background: #dcfce7;
          color: #166534;
        }

        .pill-weak {
          background: #fee2e2;
          color: #991b1b;
        }

        .pill-neutral {
          background: #f1f5f9;
          color: #475569;
        }

        @media (max-width: 640px) {
          .micro-skills-container {
            grid-template-columns: 1fr !important;
          }
          .section-tabs {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .active-section-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .btn-section-action {
            width: 100%;
          }
        }
      ` }} />

      <SiteHeader />

      <main className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <Link href="/exam-prep" className="back-link">
              ← Back to Exams
            </Link>
            <h1 className="header-title">{exam?.name || 'Exam'} Dashboard</h1>
            <p className="header-subtitle">
              Welcome back, <strong>{session?.name}</strong>. Practice and monitor your prep for {exam?.fullName || exam?.name || 'your competitive exam'}.
            </p>
          </div>
        </div>

        <div className="grid-layout">
          {/* Left panel: Practice Sections & Topics */}
          <div className="left-panel">
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Adaptive Practice Drills</h2>
            
            {/* 3 Horizontal Tabs */}
            <div className="section-tabs">
              {exam?.sections?.map((section) => {
                const isActive = activeTab === section.id;
                const theta = profile?.sectionTheta?.[section.id] ?? 0.5;
                const sectionScore = Math.round(((theta - 0.05) / 0.9) * 100);
                
                return (
                  <button
                    key={section.id}
                    className={`section-tab ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(section.id)}
                  >
                    <span className="tab-icon">{section.icon || '📝'}</span>
                    <div className="tab-info">
                      <span className="tab-name">{section.shortName || section.name}</span>
                      <span className="tab-rating">Rating: {sectionScore}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Section Info Panel */}
            {activeSectionObj && (
              <div className="active-section-header">
                <div>
                  <h3 className="active-section-title">{activeSectionObj.name}</h3>
                  <p className="active-section-desc">{activeSectionObj.description}</p>
                </div>
                <div>
                  {gateStatus[activeTab]?.allowed !== false ? (
                    <button
                      className="btn-section-action"
                      onClick={() => handleStartSection(activeTab, activeSectionObj.name)}
                    >
                      Start Full Section Drill
                    </button>
                  ) : (
                    <button
                      className="btn-section-action btn-locked"
                      onClick={() => handleStartSection(activeTab, activeSectionObj.name)}
                    >
                      🔒 Unlock Section
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Hierarchical Topic and Micro-Skills list */}
            {activeSectionObj && (
              <div className="skills-list">
                {activeSectionObj.topics?.map((topicId, idx) => {
                  const masteryVal = profile?.topicMastery?.[topicId];
                  const isPracticed = masteryVal !== undefined;
                  const masteryPercent = isPracticed ? Math.round(masteryVal * 100) : 0;
                  
                  const isStrong = strongTopics.includes(topicId);
                  const isWeak = weakTopics.includes(topicId);
                  
                  let badgeClass = '';
                  let badgeText = '';
                  if (isStrong) {
                    badgeClass = 'pill-strong';
                    badgeText = '🔥';
                  } else if (isWeak) {
                    badgeClass = 'pill-weak';
                    badgeText = '⚠️';
                  }

                  const isAllowed = gateStatus[activeTab]?.allowed !== false;
                  // Find templates (micro-skills) linked to this topic
                  const topicTemplatesAll = templates.filter(t => {
                    const cleanTplTopic = String(t.topic || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                    const cleanTargetTopic = String(topicId || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                    return cleanTplTopic === cleanTargetTopic ||
                           cleanTplTopic.includes(cleanTargetTopic) ||
                           cleanTargetTopic.includes(cleanTplTopic);
                  });

                  // Deduplicate by name/title
                  const seenNames = new Set();
                  const topicTemplates = [];
                  for (const t of topicTemplatesAll) {
                    const tName = (t.name || t.title || '').trim();
                    if (seenNames.has(tName)) continue;
                    seenNames.add(tName);
                    topicTemplates.push(t);
                  }

                  const isExpanded = !!expandedTopics[topicId];

                  return (
                    <div key={topicId} className="skill-list-item">
                      <div className="topic-header-row">
                        <div 
                          className="skill-left" 
                          style={{ cursor: 'pointer', flexGrow: 1, display: 'flex', alignItems: 'center' }} 
                          onClick={() => toggleTopic(topicId)}
                        >
                          <span className="skill-index">{getTopicPrefix(activeTab, idx)}</span>
                          <span className="skill-name-link" style={{ textDecoration: 'none' }}>
                            {formatTopicName(topicId)}
                          </span>
                          {badgeText && (
                            <span className={`topic-pill ${badgeClass}`} style={{ padding: '2px 6px', fontSize: '11px', margin: '0 6px' }}>
                              {badgeText}
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px', fontWeight: 600 }}>
                            ({topicTemplates.length} {topicTemplates.length === 1 ? 'skill' : 'skills'})
                          </span>
                          <span style={{
                            marginLeft: '8px',
                            transition: 'transform 0.2s',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            display: 'inline-block',
                            fontSize: '10px',
                            color: '#64748b'
                          }}>
                            ▼
                          </span>
                        </div>

                        <div className="skill-right" style={{ flexShrink: 0 }}>
                          {isPracticed && (
                            <span className="skill-score-badge">
                              {masteryPercent}%
                            </span>
                          )}

                          {isAllowed ? (
                            <button
                              className="btn-skill-practice"
                              onClick={() => handleStartTopic(activeTab, activeSectionObj.name, topicId)}
                              style={{ background: '#475569' }}
                            >
                              Practice Topic (All)
                            </button>
                          ) : (
                            <button
                              className="btn-skill-lock"
                              onClick={() => handleStartTopic(activeTab, activeSectionObj.name, topicId)}
                            >
                              🔒 Locked
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nested micro-skills (templates) - only visible if expanded */}
                      {isExpanded && topicTemplates.length > 0 && (
                        <div className="micro-skills-container">
                          {topicTemplates.map((tpl) => (
                            <div key={tpl.id || tpl._id} className="micro-skill-row">
                              <span className="micro-skill-name" style={{ marginRight: '8px', wordBreak: 'break-word' }}>
                                📝 {tpl.name || tpl.title || 'Micro skill'}
                              </span>
                              {isAllowed ? (
                                <button
                                  className="btn-micro-practice"
                                  onClick={() => handleStartTemplate(activeTab, activeSectionObj.name, topicId, tpl.id || tpl._id)}
                                >
                                  Practice Skill
                                </button>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>🔒 Locked</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel: Profile & Analytics */}
          <div className="right-panel">
            <div className="sidebar-panel">
              <div className="score-circle-container">
                <div 
                  className="score-circle"
                  style={{ '--score-deg': `${(overallScore / 100) * 360}deg` }}
                >
                  <div className="score-inner">
                    <span className="score-num">{overallScore}</span>
                    <span className="score-max">OUT OF 100</span>
                  </div>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px' }}>Estimated Proficiency</h3>
                <span className="score-status">
                  {overallScore >= 80 ? 'Excellent Prep' : overallScore >= 65 ? 'Good Progress' : overallScore >= 50 ? 'Average — Needs Work' : 'Needs Practice'}
                </span>
              </div>

              {/* Weak & Strong Topics */}
              <div className="topics-list-container">
                <h4 className="topics-list-title">Topic Performance</h4>
                
                {strongTopics.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>🔥 Strong Areas</div>
                    <div>
                      {strongTopics.map((topic, i) => (
                        <span key={i} className="topic-pill pill-strong">✓ {topic}</span>
                      ))}
                    </div>
                  </div>
                )}

                {weakTopics.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>⚠️ Needs Focus</div>
                    <div>
                      {weakTopics.map((topic, i) => (
                        <span key={i} className="topic-pill pill-weak">⚠ {topic}</span>
                      ))}
                    </div>
                  </div>
                )}

                {strongTopics.length === 0 && weakTopics.length === 0 && (
                  <div style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                    Complete a few practice drills to populate your topic breakdown!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showGate && selectedGateSection && (
        <PracticeGate
          sectionName={selectedGateSection.name}
          onClose={() => setShowGate(false)}
        />
      )}
    </div>
  );
}
