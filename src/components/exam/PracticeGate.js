'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function PracticeGate({ sectionName, limit = 1, onClose }) {
  const router = useRouter();

  return (
    <div className="gate-overlay">
      <style dangerouslySetInnerHTML={{ __html: `
        .gate-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
          font-family: var(--font-outfit), 'Inter', sans-serif;
          padding: 20px;
        }

        .gate-modal {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 24px;
          width: 100%;
          max-width: 480px;
          padding: 40px 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          text-align: center;
          position: relative;
          border: 1px solid rgba(226, 232, 240, 0.8);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .gate-badge {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #b45309;
          font-weight: 700;
          font-size: 13px;
          padding: 6px 16px;
          border-radius: 9999px;
          margin-bottom: 24px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 6px -1px rgba(251, 191, 36, 0.2);
        }

        .gate-icon {
          font-size: 64px;
          margin-bottom: 20px;
          display: inline-block;
          animation: pulse 2s infinite ease-in-out;
        }

        .gate-title {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          margin-bottom: 12px;
        }

        .gate-desc {
          font-size: 15px;
          color: #475569;
          line-height: 1.5;
          margin-bottom: 32px;
        }

        .gate-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-upgrade {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
        }

        .btn-upgrade:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -3px rgba(79, 70, 229, 0.4);
        }

        .btn-upgrade:active {
          transform: translateY(0);
        }

        .btn-back {
          background: transparent;
          color: #64748b;
          border: 1px solid #cbd5e1;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-back:hover {
          background: #f1f5f9;
          color: #334155;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      ` }} />

      <div className="gate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gate-badge">Free limit reached</div>
        <div className="gate-icon">✨</div>
        <h2 className="gate-title">Unlock Unlimited Practice</h2>
        <p className="gate-desc">
          You have completed your free daily practice session for <strong>{sectionName}</strong>.<br />
          Unlock unlimited adaptive testing, comprehensive mock exams, and parent analytics dashboard today!
        </p>

        <div className="gate-actions">
          <button className="btn-upgrade" onClick={() => router.push('/pricing')}>
            Upgrade to Premium — ₹199/mo
          </button>
          <button className="btn-back" onClick={onClose}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
