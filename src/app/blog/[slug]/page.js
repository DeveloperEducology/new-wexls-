import React from 'react';
import Link from 'next/link';
import SiteHeader from '../../../components/layout/SiteHeader';
import { getBlogPostBySlug, parseMarkdownToHtml } from '../../../lib/blog';
import { getGeneratedBlogBySlug } from '../../../lib/lessons/blog-store';
import { notFound } from 'next/navigation';
import MermaidLoader from '../../../components/blog/MermaidLoader';
import GeneratedBlogRenderer from '../../../components/blog/GeneratedBlogRenderer';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;

  // Try file-based first
  const filePost = getBlogPostBySlug(slug);
  if (filePost) {
    return {
      title: `${filePost.title} | KlassChamp Blog`,
      description: filePost.description,
      openGraph: {
        title: filePost.title,
        description: filePost.description,
        type: 'article',
        publishedTime: filePost.date,
        authors: [filePost.author || 'KlassChamp Team'],
      },
    };
  }

  // Try DB-based
  const dbPost = await getGeneratedBlogBySlug(slug);
  if (dbPost) {
    return {
      title: `${dbPost.seoTitle || dbPost.headline} | KlassChamp Blog`,
      description: dbPost.seoDescription || '',
      openGraph: {
        title: dbPost.seoTitle || dbPost.headline,
        description: dbPost.seoDescription || '',
        type: 'article',
        publishedTime: dbPost.createdAt?.toISOString?.() || '',
      },
    };
  }

  return { title: 'Post Not Found | KlassChamp Blog' };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;

  // ── 1. Try file-based markdown blog ──
  const filePost = getBlogPostBySlug(slug);
  if (filePost) {
    return (
      <>
        <SiteHeader />
        <main style={{ maxWidth: 720, margin: '60px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
          <style dangerouslySetInnerHTML={{ __html: `
            .blog-image-grid {
              display: flex;
              flex-flow: row wrap;
              gap: 16px;
              margin: 28px 0;
              justify-content: center;
              align-items: center;
            }
            .blog-image-grid img {
              margin: 0;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            }
            .blog-image-grid img:not([style*="width"]) {
              flex: 1 1 200px;
              width: 100%;
              height: 220px;
              object-fit: cover;
            }
            @media (max-width: 600px) {
              .blog-image-grid img:not([style*="width"]) {
                flex: 1 1 100%;
                height: auto;
              }
            }
          `}} />
          <Link href="/blog" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', marginBottom: 30 }}>
            ← Back to Blog
          </Link>
          <span style={{ fontSize: '0.85rem', color: '#0ea5e9', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
            {filePost.category || 'Education'}
          </span>
          <h1 style={{ fontSize: '2.8rem', color: '#1e293b', lineHeight: 1.15, marginBottom: 16 }}>{filePost.title}</h1>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 40, borderBottom: '1px solid #e2e8f0', paddingBottom: 20 }}>
            Published on {filePost.date} • Written by {filePost.author || 'KlassChamp Team'}
          </div>
          <article
            style={{ color: '#334155', fontSize: '1.1rem', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(filePost.content) }}
          />
          <MermaidLoader />
        </main>
      </>
    );
  }

  // ── 2. Try DB-backed generated blog ──
  const dbPost = await getGeneratedBlogBySlug(slug);
  if (dbPost) {
    // Serialize for client component
    const serialized = JSON.parse(JSON.stringify(dbPost));
    return (
      <>
        <SiteHeader />
        <GeneratedBlogRenderer post={serialized} />
      </>
    );
  }

  // ── 3. 404 ──
  notFound();
}
