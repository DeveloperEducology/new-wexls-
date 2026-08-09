'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function BlogFilterList({ initialFilePosts, initialDbPosts }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'mat' | 'arithmetic' | 'language'
  const [searchTerm, setSearchTerm] = useState('');

  // Combine both editorial and generated posts
  const allPosts = [
    ...initialFilePosts.map(p => ({ ...p, isEditorial: true })),
    ...initialDbPosts.map(p => ({ ...p, isEditorial: false }))
  ];

  // Filter logic
  const filteredPosts = allPosts.filter(post => {
    // 1. Search term filter
    const title = String(post.seoTitle || post.headline || post.concept || post.title || '').toLowerCase();
    const desc = String(post.seoDescription || post.description || '').toLowerCase();
    const cleanSearch = searchTerm.toLowerCase();
    if (searchTerm && !title.includes(cleanSearch) && !desc.includes(cleanSearch)) {
      return false;
    }

    // 2. Exam Section Filter
    if (activeFilter === 'all') return true;

    const subject = String(post.subject || post.category || '').toLowerCase();
    const concept = String(post.concept || post.title || '').toLowerCase();
    const rawTags = Array.isArray(post.tags) ? post.tags : (typeof post.tags === 'string' ? [post.tags] : []);
    const tags = rawTags.map(t => String(t).toLowerCase());

    if (activeFilter === 'mat') {
      return (
        subject.includes('mat') ||
        subject.includes('mental') ||
        subject.includes('figure') ||
        concept.includes('mat') ||
        concept.includes('figure') ||
        tags.includes('mat') ||
        tags.includes('mental ability') ||
        tags.includes('figures')
      );
    }
    if (activeFilter === 'arithmetic') {
      return (
        subject.includes('arith') ||
        subject.includes('math') ||
        concept.includes('arith') ||
        concept.includes('math') ||
        tags.includes('arithmetic') ||
        tags.includes('math')
      );
    }
    if (activeFilter === 'language') {
      return (
        subject.includes('lang') ||
        subject.includes('english') ||
        subject.includes('passage') ||
        concept.includes('passage') ||
        concept.includes('grammar') ||
        tags.includes('language') ||
        tags.includes('english')
      );
    }

    return true;
  });

  return (
    <div style={{ marginTop: 24 }}>
      {/* Search & Subject Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: activeFilter === 'all' ? '#0f172a' : '#f1f5f9',
              color: activeFilter === 'all' ? '#ffffff' : '#475569',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            📚 All Articles
          </button>
          <button
            onClick={() => setActiveFilter('mat')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: activeFilter === 'mat' ? '#a855f7' : '#f1f5f9',
              color: activeFilter === 'mat' ? '#ffffff' : '#475569',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            🧠 Mental Ability (MAT)
          </button>
          <button
            onClick={() => setActiveFilter('arithmetic')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: activeFilter === 'arithmetic' ? '#22c55e' : '#f1f5f9',
              color: activeFilter === 'arithmetic' ? '#ffffff' : '#475569',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            🔢 Arithmetic Math
          </button>
          <button
            onClick={() => setActiveFilter('language')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: activeFilter === 'language' ? '#ea580c' : '#f1f5f9',
              color: activeFilter === 'language' ? '#ffffff' : '#475569',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            📖 Language passages
          </button>
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
          <span style={{ fontSize: '16px', color: '#64748b' }}>🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search articles by title, tags or concepts..."
            style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: 600, color: '#1e293b', outline: 'none' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      {filteredPosts.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1.5px dashed #cbd5e1' }}>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>📰</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>No articles match your selection</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Try clearing your search or picking a different section.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
          {filteredPosts.map(post => {
            const dateStr = post.createdAt
              ? new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : post.date || '';

            const rawTags = Array.isArray(post.tags) ? post.tags : (typeof post.tags === 'string' ? [post.tags] : []);
            const tags = rawTags.slice(0, 3);
            const displayTitle = post.seoTitle || post.headline || post.concept || post.title || 'Untitled Post';
            const displayDesc = post.seoDescription || post.description || '';

            // Section colors/badges
            let secColor = '#6366f1';
            let secBg = '#eef2ff';
            if (post.subject === 'math' || post.subject?.toLowerCase().includes('arithmetic') || post.subject?.toLowerCase().includes('math')) {
              secColor = '#16a34a';
              secBg = '#dcfce7';
            } else if (post.subject?.toLowerCase().includes('language') || post.subject === 'english') {
              secColor = '#ea580c';
              secBg = '#ffedd5';
            }

            return (
              <article
                key={post.slug}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)';
                }}
              >
                {/* Premium Gradient Header Visual */}
                <div style={{
                  height: '110px',
                  background: `linear-gradient(135deg, ${secColor}12 0%, ${secColor}22 100%)`,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ background: secBg, color: secColor, fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {post.subject || post.category || 'General'}
                    </span>
                    {post.examName && (
                      <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {post.examName}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                    {post.isEditorial ? '✍️ Editorial Team' : '🤖 AI Generated'}
                  </span>
                </div>

                {/* Content body */}
                <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0 0 10px 0', color: '#0f172a', lineHeight: 1.4, fontFamily: 'Outfit, sans-serif' }}>
                      {displayTitle}
                    </h3>
                    <p style={{ color: '#475569', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {displayDesc}
                    </p>
                  </div>

                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                      {tags.map((t, i) => (
                        <span key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer read link */}
                <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{dateStr}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{ color: secColor, fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    Read Article ➔
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
