'use client';

import React from 'react';
import Link from 'next/link';
import SiteHeader from '../../components/layout/SiteHeader';

const EXAMS_LIST = [
  {
    id: 'jnvst',
    name: 'JNVST',
    fullName: 'Jawahar Navodaya Vidyalaya Selection Test',
    classTarget: 'Class 6 Entrance',
    status: 'active',
    icon: '🏫',
    description: 'Highly competitive admission test for Jawahar Navodaya Vidyalayas. Consists of Mental Ability, Arithmetic, and Language sections.',
    metrics: '3 Sections • 100 Marks',
    color: '#4f46e5',
    colorGradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    bgLight: '#eef2ff'
  },
  {
    id: 'aissee',
    name: 'AISSEE (Sainik School)',
    fullName: 'All India Sainik Schools Entrance Examination',
    classTarget: 'Class 6 & 9 Entrance',
    status: 'coming_soon',
    icon: '🎖️',
    description: 'National level entrance examination for admission to Class VI and Class IX in Sainik Schools across India.',
    metrics: '4 Sections • 300 Marks',
    color: '#0891b2',
    colorGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    bgLight: '#ecfeff'
  },
  {
    id: 'ssc',
    name: 'SSC CGL',
    fullName: 'Staff Selection Commission - Combined Graduate Level',
    classTarget: 'Graduate Level',
    status: 'coming_soon',
    icon: '💼',
    description: 'Government service entrance exam for recruiting staff to various posts in ministries, departments and organizations.',
    metrics: '4 Sections • Tier I & II',
    color: '#059669',
    colorGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    bgLight: '#ecfdf5'
  }
];

export default function ExamPrepLanding() {
  return (
    <div className="exam-prep-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .exam-prep-root {
          min-height: 100vh;
          background: #f8fafc;
          font-family: var(--font-outfit), 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
        }

        .exam-prep-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px;
          width: 100%;
          flex-grow: 1;
        }

        .hero-section {
          text-align: center;
          margin-bottom: 56px;
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-eyebrow {
          font-size: 13px;
          font-weight: 800;
          color: #4f46e5;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
          display: block;
        }

        .hero-title {
          font-size: 42px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.15;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 18px;
          color: #475569;
          line-height: 1.5;
        }

        .exams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 32px;
        }

        .exam-card {
          background: white;
          border-radius: 24px;
          padding: 36px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 10px 15px -3px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .exam-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: var(--card-gradient);
        }

        .exam-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
        }

        .exam-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: var(--bg-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 24px;
        }

        .exam-badge {
          position: absolute;
          top: 24px;
          right: 24px;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-active {
          background: #dcfce7;
          color: #15803d;
        }

        .badge-soon {
          background: #f1f5f9;
          color: #64748b;
        }

        .exam-title-group {
          margin-bottom: 16px;
        }

        .exam-target {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 4px;
          display: block;
        }

        .exam-name {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .exam-fullname {
          font-size: 14px;
          color: #64748b;
          line-height: 1.4;
        }

        .exam-desc {
          font-size: 15px;
          color: #475569;
          line-height: 1.5;
          margin-bottom: 32px;
          flex-grow: 1;
        }

        .exam-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #f1f5f9;
          padding-top: 24px;
          margin-top: auto;
        }

        .exam-metrics {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
        }

        .btn-card-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-active {
          background: var(--card-gradient);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .btn-active:hover {
          opacity: 0.95;
          transform: scale(1.02);
        }

        .btn-disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .card-inactive {
          opacity: 0.75;
        }

        .card-inactive:hover {
          transform: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
      ` }} />

      <SiteHeader />

      <main className="exam-prep-content">
        <div className="hero-section">
          <span className="hero-eyebrow">Level Up Your Score</span>
          <h1 className="hero-title">Competitive Exam Prep</h1>
          <p className="hero-subtitle">
            Master entrance exams with our intelligent, adaptive testing engine. Solve real exam-level questions that adjust dynamically to your understanding.
          </p>
        </div>

        <div className="exams-grid">
          {EXAMS_LIST.map((exam) => {
            const isActive = exam.status === 'active';
            return (
              <div
                key={exam.id}
                className={`exam-card ${!isActive ? 'card-inactive' : ''}`}
                style={{
                  '--card-gradient': exam.colorGradient,
                  '--bg-light': exam.bgLight
                }}
              >
                <span className={`exam-badge ${isActive ? 'badge-active' : 'badge-soon'}`}>
                  {isActive ? 'Available' : 'Coming Soon'}
                </span>

                <div className="exam-icon-wrapper">
                  {exam.icon}
                </div>

                <div className="exam-title-group">
                  <span className="exam-target">{exam.classTarget}</span>
                  <h2 className="exam-name">{exam.name}</h2>
                  <div className="exam-fullname">{exam.fullName}</div>
                </div>

                <p className="exam-desc">{exam.description}</p>

                <div className="exam-footer">
                  <span className="exam-metrics">{exam.metrics}</span>
                  {isActive ? (
                    <Link href="/exam-prep/jnvst" className="btn-card-action btn-active">
                      Start Prep →
                    </Link>
                  ) : (
                    <button className="btn-card-action btn-disabled" disabled>
                      Locked
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
