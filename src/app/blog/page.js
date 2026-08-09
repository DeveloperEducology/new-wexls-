import React from 'react';
import Link from 'next/link';
import SiteHeader from '../../components/layout/SiteHeader';
import { getBlogPosts } from '../../lib/blog';
import { listGeneratedBlogs } from '../../lib/lessons/blog-store';
import BlogFilterList from './BlogFilterList';


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
    const rawDbPosts = await listGeneratedBlogs({ limit: 50 });
    dbPosts = JSON.parse(JSON.stringify(rawDbPosts));
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

        {!hasContent ? (
          <div style={{ padding: 40, background: '#f8fafc', borderRadius: 8, textAlign: 'center', marginTop: 32 }}>
            <p style={{ color: '#64748b' }}>No blog posts yet. <Link href="/blog-generator" style={{ color: '#7c3aed', fontWeight: 700 }}>Generate your first one →</Link></p>
          </div>
        ) : (
          <BlogFilterList initialFilePosts={filePosts} initialDbPosts={dbPosts} />
        )}
      </main>
    </>
  );
}
