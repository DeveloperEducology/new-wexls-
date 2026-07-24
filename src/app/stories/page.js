'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { KIDS_STORIES } from '@/lib/stories/storiesData';

export default function StoriesPage() {
  const [stories, setStories] = useState(KIDS_STORIES);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/stories')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.stories) && data.stories.length > 0) {
          setStories(data.stories);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const categories = ['All', 'Moral Stories', 'Adventure', 'Phonics Readers', 'Bedtime Stories'];

  const filteredStories = stories.filter(story => {
    const matchesCat = selectedCategory === 'All' || story.category === selectedCategory;
    const matchesSearch = (story.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (story.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f0fdf4 0%, #e0f2fe 100%)',
      fontFamily: 'var(--font-outfit), "Outfit", "Inter", sans-serif',
      color: '#1e293b',
      paddingBottom: '60px'
    }}>
      {/* Header Banner */}
      <header style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        color: '#ffffff',
        padding: '40px 24px',
        textAlign: 'center',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px',
        boxShadow: '0 10px 30px rgba(124, 58, 237, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          fontSize: '120px',
          opacity: 0.1,
          pointerEvents: 'none'
        }}>📖</div>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <span style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            🌟 Read & Learn Together
          </span>

          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 900,
            margin: '16px 0 8px 0',
            letterSpacing: '-1px'
          }}>
            Interactive Stories for Kids
          </h1>

          <p style={{
            fontSize: '16px',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 24px auto',
            lineHeight: 1.6
          }}>
            Enjoy read-aloud voice narration, tap-to-learn vocabulary words, and fun quizzes after every story!
          </p>

          {/* Search Box */}
          <div style={{
            maxWidth: '480px',
            margin: '0 auto',
            position: 'relative'
          }}>
            <input
              type="text"
              placeholder="🔍 Search stories by title or word..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '50px',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                outline: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                color: '#0f172a'
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', margin: '32px auto 0 auto', padding: '0 20px' }}>
        {/* Category Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '36px'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '10px 22px',
                borderRadius: '50px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                background: selectedCategory === cat
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : '#ffffff',
                color: selectedCategory === cat ? '#ffffff' : '#475569',
                boxShadow: selectedCategory === cat
                  ? '0 6px 20px rgba(16,185,129,0.35)'
                  : '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              {cat === 'All' ? '✨ All Stories' : cat}
            </button>
          ))}
        </div>

        {/* Stories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '28px'
        }}>
          {filteredStories.map(story => (
            <div
              key={story.slug}
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 18px 40px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.06)';
              }}
            >
              {/* Cover Card Banner */}
              <div style={{
                height: '180px',
                background: story.colorTheme,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}>
                <img
                  src={story.coverImage}
                  alt={story.title}
                  style={{
                    maxHeight: '140px',
                    maxWidth: '80%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))'
                  }}
                />

                <span style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'rgba(255,255,255,0.9)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#334155'
                }}>
                  ⏱️ {story.readTime}
                </span>

                <span style={{
                  position: 'absolute',
                  bottom: '14px',
                  left: '14px',
                  background: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  🎓 {story.grade}
                </span>
              </div>

              {/* Story Content Meta */}
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#6366f1',
                  textTransform: 'uppercase',
                  marginBottom: '6px'
                }}>
                  {story.category}
                </span>

                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  margin: '0 0 10px 0',
                  color: '#0f172a'
                }}>
                  {story.title}
                </h2>

                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  lineHeight: 1.6,
                  margin: '0 0 20px 0',
                  flex: 1
                }}>
                  {story.summary}
                </p>

                <Link
                  href={`/stories/${story.slug}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '15px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  📖 Read Story Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
