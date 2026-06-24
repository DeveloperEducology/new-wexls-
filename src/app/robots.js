export default function robots() {
  const baseUrl = 'https://klasschamp.com'; // Change to production domain

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/grades', '/science', '/blog', '/blog/*'],
      disallow: [
        '/admin/',
        '/api/',
        '/student/',
        '/teacher/',
        '/parent/',
        '/practice/',
        '/dashboard/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
