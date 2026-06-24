import { getBlogPosts } from '../lib/blog';

export default async function sitemap() {
  const baseUrl = 'https://klasschamp.com'; // Change to production domain

  // 1. Static public paths
  const staticPaths = ['', '/grades', '/science', '/blog'].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Dynamic blog post paths
  const blogPosts = getBlogPosts();
  const blogPaths = blogPosts.map(post => {
    let dateStr = post.date;
    let isoDate;
    try {
      isoDate = new Date(dateStr).toISOString();
    } catch (e) {
      isoDate = new Date().toISOString();
    }
    return {
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: isoDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    };
  });

  return [...staticPaths, ...blogPaths];
}
