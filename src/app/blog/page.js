import React from 'react';
import Link from 'next/link';
import SiteHeader from '../../components/layout/SiteHeader';
import { getBlogPosts } from '../../lib/blog';
import { listGeneratedBlogs } from '../../lib/lessons/blog-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'KlassChamp Blog | Resources & Guides for Parents & Teachers',
  description: 'Read educational guides, teaching activities, and learning strategies for early math, English, and science curriculum.',
};

export default async function BlogIndex() {
  // File-based (static) posts
  const filePosts = getBlogPosts();

  // DB-backed generated posts
  let dbPosts = [];
  try {
    dbPosts = await listGeneratedBlogs({ limit: 50 });
  } catch {
    // DB not available — degrade gracefully
  }

  const hasContent = filePosts.length > 0 || dbPosts.length > 0;

  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 1080, margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 8, color: '#1e293b' }}>KlassChamp Blog</h1>
            <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
              Parent resources, curriculum guides, and AI-generated exam prep articles.
            </p>
          </div>
          <Link
            href="/blog-generator"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px',
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: 'white', borderRadius: 10, fontWeight: 700,
              fontSize: '0.9rem', textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
            }}
          >
            ✨ Generate New Blog
          </Link>
        </div>

        {!hasContent && (
          <div style={{ padding: 40, background: '#f8fafc', borderRadius: 8, textAlign: 'center', marginTop: 32 }}>
            <p style={{ color: '#64748b' }}>No blog posts yet. <Link href="/blog-generator" style={{ color: '#7c3aed', fontWeight: 700 }}>Generate your first one →</Link></p>
          </div>
        )}

        {/* ── AI-Generated DB Posts ── */}
        {dbPosts.length > 0 && (
          <section style={{ marginTop: 32, marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', color: '#1e293b', margin: 0 }}>🤖 AI-Generated Exam Prep</h2>
              <span style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {dbPosts.length} posts
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {dbPosts.map(post => {
                const dateStr = post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '';
                const tags = post.tags?.slice(0, 3) || [];
                return (
                  <article
                    key={post.slug}
                    style={{
                      border: '1.5px solid #ede9fe',
                      borderRadius: 14,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'white',
                      boxShadow: '0 1px 4px rgba(124,58,237,0.07)',
                      transition: 'box-shadow 0.2s',
                    }}
                  >
                    {/* Colour bar */}
                    <div style={{ height: 4, background: 'linear-gradient(90deg,#7c3aed,#4f46e5)' }} />

                    <div style={{ padding: '18px 20px', flexGrow: 1 }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {post.examName && (
                          <span style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {post.examName}
                          </span>
                        )}
                        {post.subject && (
                          <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                            {post.subject}
                          </span>
                        )}
                        {post.grade && (
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                            Grade {post.grade}
                          </span>
                        )}
                      </div>

                      <h2 style={{ fontSize: '1.05rem', margin: '0 0 8px', color: '#1e293b', lineHeight: 1.4 }}>
                        {post.seoTitle || post.headline || post.concept}
                      </h2>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.seoDescription || ''}
                      </p>

                      {tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {tags.map((t, i) => (
                            <span key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#6b7280', fontSize: '0.68rem', padding: '2px 7px', borderRadius: 20 }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#fafbff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{dateStr}</span>
                      <Link
                        href={`/blog/${post.slug}`}
                        style={{ color: '#7c3aed', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}
                      >
                        Read Post →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ── File-based posts ── */}
        {filePosts.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', color: '#1e293b', margin: 0 }}>📝 Editorial Posts</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {filePosts.map(post => (
                <article key={post.slug} style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'white' }}>
                  <div style={{ padding: 24, flexGrow: 1 }}>
                    <span style={{ fontSize: '0.8rem', color: '#0ea5e9', fontWeight: 600, textTransform: 'uppercase' }}>
                      {post.category || 'Education'}
                    </span>
                    <h2 style={{ fontSize: '1.4rem', margin: '8px 0 12px 0', color: '#1e293b' }}>{post.title}</h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: 20 }}>
                      {post.description}
                    </p>
                  </div>
                  <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{post.date}</span>
                    <Link href={`/blog/${post.slug}`} style={{ color: '#0ea5e9', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                      Read Post →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
