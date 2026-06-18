'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SiteHeader() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.success && data.authenticated) {
        setSession(data.session);
      } else {
        setSession(null);
      }
    } catch (e) {
      console.error("Failed to load session in header:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/login';
      }
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Super Admin',
      'school-admin': 'School Admin',
      teacher: 'Teacher',
      parent: 'Parent',
      student: 'Student'
    };
    return labels[role] || role;
  };

  const getDashboardHref = (role) => {
    const paths = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      parent: '/parent/dashboard',
      'school-admin': '/school-admin/dashboard',
      admin: '/admin/dashboard'
    };
    return paths[role] || '/';
  };

  return (
    <header className="site-header">
      <div className="site-header-container">
        <Link href="/" className="site-logo">
          <Image
            src="/images/klasschamp_logo.png"
            alt="KlassChamp Logo"
            width={40}
            height={40}
            className="logo-image"
          />
          <span className="logo-text">KlassChamp</span>
        </Link>
        <div className="site-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {!loading && session ? (
            <>
              {/* Logged in User Badge */}
              <Link href={getDashboardHref(session.role)} style={{ textDecoration: 'none' }}>
                <div className="user-badge" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(99, 102, 241, 0.08)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                  e.currentTarget.style.transform = 'none';
                }}
                >
                  <span className="user-avatar" style={{ fontSize: '1.1rem' }}>👤</span>
                  <span className="user-name" style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#1e293b'
                  }}>
                    {session.name}
                  </span>
                  <span className="user-role-label" style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#ffffff',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}>
                    {getRoleLabel(session.role)}
                  </span>
                </div>
              </Link>

              {/* Logout Action */}
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.08)'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/docs/option-pooling" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 600, fontSize: '0.9rem' }}>
                Option Pooling Docs
              </Link>
              <Link href="/docs/dynamic-templates" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 600, fontSize: '0.9rem', marginRight: '10px' }}>
                Template Builder Docs
              </Link>
              {!loading && (
                <Link href="/login" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 600, fontSize: '0.9rem' }}>
                  Sign In
                </Link>
              )}
              <Link href="/practice" className="btn-start-practice">
                Quick Practice
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
