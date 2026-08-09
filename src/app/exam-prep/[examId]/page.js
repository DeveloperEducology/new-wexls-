'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import PracticeGate from '../../../components/exam/PracticeGate';
import { formatPracticeUrl } from '../../../lib/curriculum/urlHelpers';

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
  const [activeTab, setActiveTab] = useState('mat');
  const [templates, setTemplates] = useState([]);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [studentStats, setStudentStats] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);

  const toggleTopic = (topicId) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  // Restore active tab from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTab = localStorage.getItem(`activeTab_${examId}`);
      if (storedTab) {
        setActiveTab(storedTab);
      }
    }
  }, [examId]);

  // Persist active tab to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab) {
      localStorage.setItem(`activeTab_${examId}`, activeTab);
    }
  }, [activeTab, examId]);

  // Set default active tab if not set
  useEffect(() => {
    if (exam?.sections?.length > 0 && !activeTab) {
      setActiveTab(exam.sections[0].id);
    }
  }, [exam, activeTab]);

  // Compute countdown timer
  useEffect(() => {
    const examDate = new Date('2027-01-16T00:00:00');
    const today = new Date();
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysLeft(diffDays > 0 ? diffDays : 0);
  }, []);

  // 1. Load User Session
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        const activeUserId = data.success && data.authenticated ? data.session.userId : 'guest_child';
        const userName = data.success && data.authenticated ? (data.session.name || 'Rahul') : 'Rahul';
        setSession({ userId: activeUserId, name: userName });
      } catch (err) {
        setSession({ userId: 'guest_child', name: 'Rahul' });
      }
    }
    loadUser();
  }, []);

  // 2. Load exam details, templates & User Profile
  useEffect(() => {
    if (!session || !examId) return;

    async function loadData() {
      try {
        const res = await fetch(`/api/exams/${examId}?userId=${session.userId}`);
        const data = await res.json();
        if (data.success) {
          setExam(data.exam);
          setProfile(data.profile);
          
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

        const templatesRes = await fetch(`/api/admin/templates?examId=${examId}`);
        const templatesData = await templatesRes.json();
        if (templatesData.success) {
          setTemplates(templatesData.templates || []);
        }

        try {
          const statsRes = await fetch(`/api/dashboard/student?userId=${session.userId}`);
          const statsData = await statsRes.json();
          if (statsData.success) {
            setStudentStats(statsData);
          }
        } catch (statsErr) {
          console.error("Failed to load student stats:", statsErr);
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
      router.push(formatPracticeUrl({ examId, section: sectionId, userId: session?.userId }));
    }
  };

  const handleStartTopic = (sectionId, sectionName, topicId) => {
    const isAllowed = gateStatus[sectionId]?.allowed !== false;
    if (!isAllowed) {
      setSelectedGateSection({ id: sectionId, name: sectionName });
      setShowGate(true);
    } else {
      router.push(formatPracticeUrl({ examId, section: sectionId, topicId, userId: session?.userId }));
    }
  };

  const handleStartTemplate = (sectionId, sectionName, topicId, templateId) => {
    const isAllowed = gateStatus[sectionId]?.allowed !== false;
    if (!isAllowed) {
      setSelectedGateSection({ id: sectionId, name: sectionName });
      setShowGate(true);
    } else {
      router.push(formatPracticeUrl({ examId, section: sectionId, topicId, skillId: templateId, userId: session?.userId }));
    }
  };

  const scrollToTopicsSection = (sectionId) => {
    if (sectionId) setActiveTab(sectionId);
    const el = document.getElementById('topics-skills-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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
            font-family: 'Outfit', 'Inter', sans-serif;
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

  // Calculate estimated readiness percentage
  const matTheta = profile?.sectionTheta?.mat ?? 0.5;
  const arithTheta = profile?.sectionTheta?.arithmetic ?? 0.5;
  const langTheta = profile?.sectionTheta?.language ?? 0.5;
  const avgTheta = (matTheta + arithTheta + langTheta) / 3;
  const jnvstReadiness = Math.min(100, Math.max(0, Math.round(((avgTheta - 0.05) / 0.9) * 100)));

  const weakTopics = profile?.weakTopics || [];
  const strongTopics = profile?.strongTopics || [];

  // Subjects summary list mapping
  const subjectCards = [
    {
      id: 'mat',
      name: 'Mental Ability',
      icon: '🧠',
      bgColor: '#f3e8ff',
      iconColor: '#9333ea',
      barColor: '#a855f7',
      progress: Math.min(100, Math.max(0, Math.round(((matTheta - 0.05) / 0.9) * 100)))
    },
    {
      id: 'arithmetic',
      name: 'Arithmetic',
      icon: '🧮',
      bgColor: '#dcfce7',
      iconColor: '#16a34a',
      barColor: '#22c55e',
      progress: Math.min(100, Math.max(0, Math.round(((arithTheta - 0.05) / 0.9) * 100)))
    },
    {
      id: 'language',
      name: 'Language',
      icon: '📖',
      bgColor: '#ffedd5',
      iconColor: '#ea580c',
      barColor: '#f97316',
      progress: Math.min(100, Math.max(0, Math.round(((langTheta - 0.05) / 0.9) * 100)))
    },
    {
      id: 'previous-papers',
      name: 'Previous Papers',
      icon: '📄',
      bgColor: '#dbeafe',
      iconColor: '#2563eb',
      barColor: '#3b82f6',
      progress: 54
    }
  ];

  // Continue your skills cards list
  const continueSkills = [
    {
      id: 'analogy',
      name: 'Analogy',
      sectionId: 'mat',
      icon: '🧩',
      iconBg: '#f3e8ff',
      progress: 72,
      solved: 48,
      lastPracticed: 'Yesterday'
    },
    {
      id: 'series',
      name: 'Series',
      sectionId: 'mat',
      icon: '🔗',
      iconBg: '#dbeafe',
      progress: 64,
      solved: 36,
      lastPracticed: '2 days ago'
    },
    {
      id: 'coding-decoding',
      name: 'Coding-Decoding',
      sectionId: 'mat',
      icon: '</>',
      iconBg: '#dcfce7',
      progress: 58,
      solved: 42,
      lastPracticed: 'Yesterday'
    },
    {
      id: 'figure-completion',
      name: 'Figure Completion',
      sectionId: 'mat',
      icon: '🟧',
      iconBg: '#ffedd5',
      progress: 46,
      solved: 28,
      lastPracticed: '3 days ago'
    }
  ];

  const studentFirstName = session?.name ? session.name.split(' ')[0] : 'Rahul';
  const activeSectionObj = exam?.sections?.find(s => s.id === activeTab) || exam?.sections?.[0];

  return (
    <div className="jnvst-redesign">
      <style dangerouslySetInnerHTML={{ __html: `
        .jnvst-redesign {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #0f172a;
          padding-bottom: 60px;
        }

        .dash-header {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 36px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .logo-container a {
          text-decoration: none;
        }

        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .logo-accent {
          color: #6366f1;
        }

        .unified-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .unified-nav-links .nav-link {
          text-decoration: none;
          color: #475569;
          font-size: 14px;
          font-weight: 700;
          transition: color 0.15s ease;
        }

        .unified-nav-links .nav-link:hover {
          color: #6366f1;
        }

        .unified-nav-links .nav-link.active {
          color: #6366f1;
          border-bottom: 2px solid #6366f1;
          padding-bottom: 20px;
          margin-bottom: -20px;
        }

        .unified-nav-links .nav-link-primary {
          background: #6366f1;
          color: #ffffff !important;
          padding: 8px 16px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
          transition: all 0.2s ease;
        }

        .unified-nav-links .nav-link-primary:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        .nav-sep {
          color: #e2e8f0;
          font-weight: 300;
        }

        .exam-countdown-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          margin-top: 4px;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.08);
        }


        .topbar-user {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-bell {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          font-size: 18px;
        }

        .nav-bell-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 9px;
          height: 9px;
          background: #6366f1;
          border-radius: 50%;
          border: 2px solid #ffffff;
        }

        .user-avatar-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          background: transparent;
          border: none;
        }

        .user-avatar-img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          background: #e2e8f0;
        }

        .dash-content {
          max-width: 1600px;
          margin: 0 auto;
          padding: 28px 48px;
          width: 100%;
          box-sizing: border-box;
        }

        .greeting-header {
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .greeting-title {
          font-size: 32px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .greeting-sub {
          font-size: 16px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        /* Main Grid */
        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
        }

        @media (max-width: 1024px) {
          .dash-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Card styles */
        .white-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .card-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .view-all-link {
          font-size: 13px;
          font-weight: 700;
          color: #6366f1;
          text-decoration: none;
          cursor: pointer;
        }

        .view-all-link:hover {
          text-decoration: underline;
        }

        /* Today's Goal Card */
        .goal-card {
          position: relative;
          overflow: hidden;
          background: #ffffff;
          border-radius: 24px;
          padding: 28px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .goal-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .goal-badge-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 6px 0;
        }

        .goal-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 20px 0;
        }

        .goal-progress-wrap {
          margin-bottom: 20px;
        }

        .goal-bar-bg {
          height: 12px;
          background: #f1f5f9;
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .goal-bar-fill {
          height: 100%;
          width: 70%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 20px;
        }

        .goal-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        .btn-continue {
          background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
          color: #ffffff;
          border: none;
          padding: 14px 28px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
          transition: all 0.2s ease;
          width: 100%;
          max-width: 320px;
        }

        .btn-continue:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(99, 102, 241, 0.4);
        }

        /* JNVST Ready Circular Meter Card */
        .ready-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 28px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .circle-gauge-wrap {
          position: relative;
          width: 170px;
          height: 170px;
          margin-bottom: 24px;
        }

        .circle-gauge-svg {
          transform: rotate(-90deg);
          width: 100%;
          height: 100%;
        }

        .circle-gauge-bg {
          fill: none;
          stroke: #f1f5f9;
          stroke-width: 12;
        }

        .circle-gauge-bar {
          fill: none;
          stroke: url(#purple-grad);
          stroke-width: 12;
          stroke-linecap: round;
          stroke-dasharray: 440;
          stroke-dashoffset: ${440 - (440 * jnvstReadiness) / 100};
          transition: stroke-dashoffset 1s ease-in-out;
        }

        .gauge-inner-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .gauge-pct {
          font-size: 34px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1;
        }

        .gauge-label {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          margin-top: 4px;
        }

        .gauge-next {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          margin-top: 2px;
        }

        .stats-row {
          display: flex;
          align-items: center;
          justify-content: space-around;
          width: 100%;
          border-top: 1px solid #f1f5f9;
          padding-top: 18px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stat-icon-wrap {
          font-size: 22px;
        }

        .stat-num {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
        }

        .stat-lbl {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
        }

        /* Subjects Grid */
        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        @media (max-width: 768px) {
          .subjects-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .subject-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          padding: 20px 16px;
          text-align: center;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .subject-card:hover {
          transform: translateY(-3px);
          border-color: #e2e8f0;
          box-shadow: 0 10px 24px rgba(99, 102, 241, 0.08);
        }

        .subject-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 12px;
        }

        .subject-title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .subject-pct {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .subject-bar-bg {
          width: 80%;
          height: 4px;
          background: #f1f5f9;
          border-radius: 10px;
          margin-bottom: 14px;
          overflow: hidden;
        }

        .subject-bar-fill {
          height: 100%;
          border-radius: 10px;
        }

        .subject-link {
          font-size: 13px;
          font-weight: 700;
          color: #6366f1;
          display: flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
        }

        /* Today's Mission */
        .mission-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 20px;
        }

        .mission-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 700;
          color: #334155;
        }

        .mission-check {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
        }

        .mission-check.checked {
          background: #22c55e;
          color: #ffffff;
        }

        .mission-check.unchecked {
          border: 2px solid #cbd5e1;
          background: transparent;
        }

        .mission-reward-box {
          background: #f3e8ff;
          border-radius: 16px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .gift-icon {
          font-size: 24px;
        }

        .reward-text-wrap {
          display: flex;
          flex-direction: column;
        }

        .reward-sub {
          font-size: 11px;
          color: #7e22ce;
          font-weight: 600;
        }

        .reward-title {
          font-size: 15px;
          font-weight: 900;
          color: #6b21a8;
        }

        /* Continue Your Skills Grid */
        .continue-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        @media (max-width: 640px) {
          .continue-grid {
            grid-template-columns: 1fr;
          }
          .jnvst-mock-banner {
            padding: 20px !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .jnvst-mock-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }

        .continue-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          padding: 18px 20px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .continue-top {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 14px;
        }

        .continue-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .continue-info {
          flex-grow: 1;
        }

        .continue-title {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .continue-pct {
          font-size: 12px;
          font-weight: 800;
          color: #64748b;
          text-align: right;
        }

        .continue-bar-bg {
          height: 6px;
          background: #f1f5f9;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .continue-bar-fill {
          height: 100%;
          background: #6366f1;
          border-radius: 10px;
        }

        .continue-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .continue-meta {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          line-height: 1.4;
        }

        .btn-mini-practice {
          background: #6366f1;
          color: #ffffff;
          border: none;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-mini-practice:hover {
          background: #4f46e5;
        }

        /* Achievement Banner Rows */
        .achievement-rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .achievement-banner {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .achievement-banner:hover {
          border-color: #e2e8f0;
          transform: translateX(2px);
        }

        .banner-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .banner-icon {
          font-size: 24px;
        }

        .banner-title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .banner-sub {
          font-size: 12px;
          color: #64748b;
        }

        .banner-arrow {
          font-size: 14px;
          color: #cbd5e1;
        }

        /* Topic & Micro-Skills Section Styling */
        .section-tabs-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          overflow-x: auto;
          padding-bottom: 6px;
        }

        .tab-btn {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 800;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .tab-btn.active {
          background: #6366f1;
          color: #ffffff;
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }

        .topic-accordion-card {
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 18px;
          padding: 18px 22px;
          margin-bottom: 14px;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
          transition: all 0.2s ease;
        }

        .topic-accordion-card:hover {
          border-color: #e2e8f0;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
        }

        .topic-row-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .topic-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          flex-grow: 1;
        }

        .topic-idx-badge {
          background: #f1f5f9;
          color: #6366f1;
          font-size: 12px;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 8px;
        }

        .topic-name-txt {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
        }

        .topic-skills-count {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
        }

        .skills-grid-box {
          border-top: 1px solid #f1f5f9;
          margin-top: 16px;
          padding-top: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 10px;
        }

        .skill-item-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .skill-item-btn:hover {
          background: #ffffff;
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
          transform: translateY(-1px);
        }

        .skill-code-tag {
          font-size: 11px;
          font-weight: 800;
          color: #475569;
          background: #e2e8f0;
          padding: 2px 7px;
          border-radius: 6px;
          margin-right: 8px;
        }

        .skill-item-btn:hover .skill-code-tag {
          background: #6366f1;
          color: #ffffff;
        }

        .skill-label-txt {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
          line-height: 1.3;
        }

        /* Recent Achievement Card */
        .recent-achieve-box {
          background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%);
          border-radius: 20px;
          padding: 20px;
          border: 1px solid #e0e7ff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .achieve-badge-art {
          font-size: 38px;
          flex-shrink: 0;
        }

        .achieve-details {
          flex-grow: 1;
        }

        .achieve-title {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .achieve-sub {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .achieve-xp {
          font-size: 15px;
          font-weight: 900;
          color: #6366f1;
          flex-shrink: 0;
        }
      ` }} />

      {/* SVG Gradient definitions */}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Unified JNVST Header */}
      <header className="dash-header">
        <div className="logo-container">
          <Link href="/">
            <span className="logo-text">Klass<span className="logo-accent">Champ</span></span>
          </Link>
        </div>
        <nav className="unified-nav-links">
          <Link href={`/exam-prep/${examId}`} className="nav-link active">Dashboard</Link>
          <Link href={`/exam-prep/${examId}/topics`} className="nav-link">Practice</Link>
          <Link href={`/exam-prep/${examId}/mock-test`} className="nav-link nav-link-primary">Mock Test</Link>
          <span className="nav-sep">|</span>
          <Link href="/exam-prep" className="nav-link">← All Exams</Link>
        </nav>
        
        <div className="topbar-user">
          <div className="nav-bell" title="Notifications">
            🔔
            <span className="nav-bell-dot"></span>
          </div>
          <button className="user-avatar-btn">
            <img 
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${studentFirstName}`} 
              alt="User Avatar"
              className="user-avatar-img"
            />
          </button>
        </div>
      </header>

      <main className="dash-content">
        {/* Header Greeting */}
        <div className="greeting-header">
          <div>
            <h1 className="greeting-title">
              Good Morning, {studentFirstName} 👋
            </h1>
            <p className="greeting-sub">Let's continue your JNVST preparation.</p>
          </div>
          <div className="exam-countdown-badge">
            <span className="countdown-icon">⏳</span>
            <span><strong>{daysLeft} Days</strong> until JNVST Exam (Jan 16, 2027)</span>
          </div>
        </div>


        {/* Main Grid */}
        <div className="dash-grid">
          {/* Left Main Column */}
          <div className="dash-left-col">

            {/* Official JNVST Full Selection Mock Test Card */}
            <div className="jnvst-mock-banner" style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
              color: '#fff',
              borderRadius: '24px',
              padding: '28px',
              marginBottom: '28px',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ background: '#22c55e', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>LIVE EXAM MODE</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>120 Mins · 80 Questions · 100 Marks</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px', color: '#fff' }}>Official JNVST Full Selection Mock Test</h2>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0, maxWidth: '520px' }}>
                  Simulate the exact Jawahar Navodaya 80-question exam with timed sections (Mental Ability, Arithmetic & Language) and real-time selection cutoff analysis.
                </p>
              </div>

              <Link href={`/exam-prep/${examId}/mock-test`} className="jnvst-mock-btn" style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                padding: '14px 28px',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}>
                🚀 Launch Full Mock Test →
              </Link>
            </div>

            {/* Today's Goal Card */}
            <div className="goal-card" style={{ marginBottom: '28px' }}>
              <div className="goal-top">
                <div>
                  <h2 className="goal-badge-title">
                    🎯 Today's Goal
                  </h2>
                  <p className="goal-desc">Complete 10 skills to finish your daily goal.</p>

                  <div className="goal-progress-wrap">
                    <div className="goal-bar-bg">
                      <div className="goal-bar-fill"></div>
                    </div>
                    <div className="goal-meta">
                      <span>⏱️ 12 min remaining</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>7 / 10</span>
                    </div>
                  </div>

                  <button 
                    className="btn-continue"
                    onClick={() => handleStartSection('mat', 'Mental Ability')}
                  >
                    Continue Learning →
                  </button>
                </div>

                {/* 3D Target Graphic Illustration */}
                <div style={{ background: '#f5f3ff', borderRadius: '50%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '64px' }}>🎯</span>
                </div>
              </div>
            </div>

            {/* Subjects Grid */}
            <div style={{ marginBottom: '32px' }}>
              <div className="card-header-row">
                <h3 className="card-title">Subjects</h3>
                <span className="view-all-link" onClick={() => scrollToTopicsSection('mat')}>View All</span>
              </div>

              <div className="subjects-grid">
                {subjectCards.map((sub) => (
                  <div 
                    key={sub.id}
                    className={`subject-card ${activeTab === sub.id ? 'active' : ''}`}
                    onClick={() => {
                      if (sub.id === 'previous-papers') {
                        router.push(`/exam-prep/${examId}/practice/mat?mode=papers`);
                      } else {
                        setActiveTab(sub.id);
                        scrollToTopicsSection(sub.id);
                      }
                    }}
                    style={{
                      border: activeTab === sub.id ? '2px solid #6366f1' : '1px solid #f1f5f9',
                      boxShadow: activeTab === sub.id ? '0 8px 24px rgba(99, 102, 241, 0.15)' : 'none'
                    }}
                  >
                    <div className="subject-icon-box" style={{ background: sub.bgColor, color: sub.iconColor }}>
                      {sub.icon}
                    </div>
                    <div className="subject-title">{sub.name}</div>
                    <div className="subject-pct">{sub.progress}%</div>
                    
                    <div className="subject-bar-bg">
                      <div className="subject-bar-fill" style={{ width: `${sub.progress}%`, background: sub.barColor }}></div>
                    </div>

                    <span className="subject-link">Practice →</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Your Skills */}
            <div style={{ marginBottom: '32px' }}>
              <div className="card-header-row">
                <h3 className="card-title">Continue Your Skills</h3>
              </div>

              <div className="continue-grid">
                {continueSkills.map((sk) => (
                  <div key={sk.id} className="continue-card">
                    <div>
                      <div className="continue-top">
                        <div className="continue-icon-box" style={{ background: sk.iconBg }}>
                          {sk.icon}
                        </div>
                        <div className="continue-info">
                          <div className="continue-title">{sk.name}</div>
                          <div className="continue-pct">{sk.progress}%</div>
                        </div>
                      </div>

                      <div className="continue-bar-bg">
                        <div className="continue-bar-fill" style={{ width: `${sk.progress}%` }}></div>
                      </div>
                    </div>

                    <div className="continue-bottom">
                      <div className="continue-meta">
                        <div>Questions Solved: <strong>{sk.solved}</strong></div>
                        <div>Last Practiced: {sk.lastPracticed}</div>
                      </div>
                      <button 
                        className="btn-mini-practice"
                        onClick={() => handleStartTopic(sk.sectionId, 'Mental Ability', sk.id)}
                      >
                        Practice →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Achievement Banner Rows */}
              <div className="achievement-rows" style={{ marginBottom: '32px' }}>
                <div className="achievement-banner">
                  <div className="banner-left">
                    <span className="banner-icon">🎖️</span>
                    <div>
                      <div className="banner-title">Mirror Image Mastered</div>
                      <div className="banner-sub">You scored 100% in Mirror Image</div>
                    </div>
                  </div>
                  <span className="banner-arrow">❯</span>
                </div>

                <div className="achievement-banner">
                  <div className="banner-left">
                    <span className="banner-icon">🔥</span>
                    <div>
                      <div className="banner-title">18-Day Streak</div>
                      <div className="banner-sub">Keep it up! You're doing great.</div>
                    </div>
                  </div>
                  <span className="banner-arrow">❯</span>
                </div>

                <div className="achievement-banner">
                  <div className="banner-left">
                    <span className="banner-icon">🎯</span>
                    <div>
                      <div className="banner-title">500 Questions Solved</div>
                      <div className="banner-sub">Amazing! You are unstoppable.</div>
                    </div>
                  </div>
                  <span className="banner-arrow">❯</span>
                </div>
              </div>
            </div>

            {/* Practice Topics & Micro-Skills Section */}
            <div id="topics-skills-section" style={{ marginBottom: '32px' }}>
              <div className="card-header-row">
                <h3 className="card-title">📚 Practice Topics & Micro-Skills</h3>
                {activeSectionObj && (
                  <button 
                    className="btn-mini-practice"
                    onClick={() => handleStartSection(activeTab, activeSectionObj.name)}
                    style={{ background: '#475569', fontSize: '13px', padding: '8px 16px' }}
                  >
                    Start Full {activeSectionObj.name} Drill →
                  </button>
                )}
              </div>

              {/* Subject Tabs */}
              <div className="section-tabs-bar">
                {exam?.sections?.map((sec) => {
                  const isActive = activeTab === sec.id;
                  return (
                    <button
                      key={sec.id}
                      className={`tab-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveTab(sec.id)}
                    >
                      <span>{sec.icon || '📝'}</span>
                      <span>{sec.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Topics Breakdown List */}
              {activeSectionObj && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {activeSectionObj.topics?.map((topicId, idx) => {
                    const isExpanded = !!expandedTopics[topicId];
                    const isAllowed = gateStatus[activeTab]?.allowed !== false;
                    
                    // Filter matching templates for this topic
                    const topicTemplates = templates.filter(t => {
                      const cleanTplTopic = String(t.topic || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                      const cleanTargetTopic = String(topicId || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                      return cleanTplTopic === cleanTargetTopic ||
                             cleanTplTopic.includes(cleanTargetTopic) ||
                             cleanTargetTopic.includes(cleanTplTopic);
                    });

                    // Group templates by name
                    const groupedTemplates = [];
                    const nameToGroup = {};
                    for (const t of topicTemplates) {
                      const tName = (t.name || t.title || 'Micro Skill').trim();
                      if (!nameToGroup[tName]) {
                        nameToGroup[tName] = {
                          name: tName,
                          ids: [],
                          id: t.id || String(t._id),
                        };
                        groupedTemplates.push(nameToGroup[tName]);
                      }
                      nameToGroup[tName].ids.push(t.id || String(t._id));
                    }

                    return (
                      <div key={topicId} className="topic-accordion-card">
                        <div className="topic-row-head">
                          <div 
                            className="topic-title-wrap"
                            onClick={() => toggleTopic(topicId)}
                          >
                            <span className="topic-idx-badge">{getTopicPrefix(activeTab, idx)}</span>
                            <div>
                              <div className="topic-name-txt">{formatTopicName(topicId)}</div>
                              <div className="topic-skills-count">
                                {groupedTemplates.length > 0 ? `${groupedTemplates.length} skills available` : 'Comprehensive Topic Practice'}
                              </div>
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>

                          <button 
                            className="btn-mini-practice"
                            onClick={() => handleStartTopic(activeTab, activeSectionObj.name, topicId)}
                          >
                            Practice Topic →
                          </button>
                        </div>

                        {/* Expanded micro-skills grid */}
                        {isExpanded && (
                          <div className="skills-grid-box">
                            {groupedTemplates.length > 0 ? (
                              groupedTemplates.map((group, gIdx) => {
                                const skillCode = `${getTopicPrefix(activeTab, idx)}.${gIdx + 1}`;
                                return (
                                  <div
                                    key={group.id}
                                    className="skill-item-btn"
                                    onClick={() => handleStartTemplate(activeTab, activeSectionObj.name, topicId, group.ids.join(','))}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <span className="skill-code-tag">{skillCode}</span>
                                      <span className="skill-label-txt">{group.name}</span>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 800 }}>→</span>
                                  </div>
                                );
                              })
                            ) : (
                              <div 
                                className="skill-item-btn"
                                onClick={() => handleStartTopic(activeTab, activeSectionObj.name, topicId)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <span className="skill-code-tag">{getTopicPrefix(activeTab, idx)}.1</span>
                                  <span className="skill-label-txt">Standard {formatTopicName(topicId)} Practice</span>
                                </div>
                                <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 800 }}>→</span>
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

          </div>

          {/* Right Sidebar Column */}
          <div className="dash-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* JNVST Ready Circular Meter Card */}
            <div className="ready-card">
              <div className="circle-gauge-wrap">
                <svg className="circle-gauge-svg" viewBox="0 0 160 160">
                  <circle className="circle-gauge-bg" cx="80" cy="80" r="70" />
                  <circle className="circle-gauge-bar" cx="80" cy="80" r="70" />
                </svg>
                <div className="gauge-inner-text">
                  <div className="gauge-pct">{jnvstReadiness}%</div>
                  <div className="gauge-label">JNVST Ready</div>
                  <div className="gauge-next">Next Goal: 75%</div>
                </div>
              </div>

              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-icon-wrap">🔥</span>
                  <div>
                    <div className="stat-num">{studentStats?.kpis?.streakDays ?? 0}</div>
                    <div className="stat-lbl">Day Streak</div>
                  </div>
                </div>

                <div className="stat-item">
                  <span className="stat-icon-wrap">⭐</span>
                  <div>
                    <div className="stat-num">{studentStats?.kpis?.smartScore ?? 0}</div>
                    <div className="stat-lbl">XP Earned</div>
                  </div>
                </div>

                <div className="stat-item">
                  <span className="stat-icon-wrap">🏆</span>
                  <div>
                    <div className="stat-num">#{Math.max(1, 100 - Math.floor((studentStats?.kpis?.smartScore ?? 0) / 25))}</div>
                    <div className="stat-lbl">Your Rank</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Mission Card */}
            <div className="white-card">
              <h3 className="card-title" style={{ marginBottom: '18px' }}>🎯 Today's Mission</h3>

              <div className="mission-list">
                <div className="mission-item">
                  <div className={`mission-check ${(studentStats?.kpis?.questionsAttempted ?? 0) >= 5 ? 'checked' : 'unchecked'}`}>
                    {(studentStats?.kpis?.questionsAttempted ?? 0) >= 5 ? '✓' : ''}
                  </div>
                  <span>Solve 5 Questions ({(studentStats?.kpis?.questionsAttempted ?? 0)} / 5)</span>
                </div>
                <div className="mission-item">
                  <div className={`mission-check ${(studentStats?.kpis?.accuracyPercent ?? 0) >= 80 ? 'checked' : 'unchecked'}`}>
                    {(studentStats?.kpis?.accuracyPercent ?? 0) >= 80 ? '✓' : ''}
                  </div>
                  <span>Reach 80% accuracy ({(studentStats?.kpis?.accuracyPercent ?? 0)}%)</span>
                </div>
                <div className="mission-item">
                  <div className={`mission-check ${(studentStats?.kpis?.practiceMinutes ?? 0) >= 10 ? 'checked' : 'unchecked'}`}>
                    {(studentStats?.kpis?.practiceMinutes ?? 0) >= 10 ? '✓' : ''}
                  </div>
                  <span>Practice for 10 mins ({(studentStats?.kpis?.practiceMinutes ?? 0)} / 10m)</span>
                </div>
              </div>

              <div className="mission-reward-box">
                <span className="gift-icon">🎁</span>
                <div className="reward-text-wrap">
                  <span className="reward-sub">Complete all missions to earn</span>
                  <span className="reward-title">+25 XP</span>
                </div>
              </div>
            </div>

            {/* Recent Achievement Card */}
            <div className="white-card">
              <div className="card-header-row" style={{ marginBottom: '16px' }}>
                <h3 className="card-title">Recent Achievement</h3>
              </div>

              {(studentStats?.kpis?.questionsAttempted ?? 0) > 0 ? (
                <div className="recent-achieve-box">
                  <span className="achieve-badge-art">🎖️</span>
                  <div className="achieve-details">
                    <div className="achieve-title">Practice Champ</div>
                    <p className="achieve-sub">You solved {studentStats.kpis.questionsAttempted} questions with {studentStats.kpis.accuracyPercent}% accuracy</p>
                  </div>
                  <span className="achieve-xp">+{studentStats.kpis.smartScore} XP</span>
                </div>
              ) : (
                <div className="recent-achieve-box" style={{ background: '#f8fafc', border: '1px dashed #e2e8f0', boxShadow: 'none' }}>
                  <span className="achieve-badge-art">🎯</span>
                  <div className="achieve-details">
                    <div className="achieve-title">Ready for Action</div>
                    <p className="achieve-sub">Solve your first question to unlock achievements!</p>
                  </div>
                </div>
              )}
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
