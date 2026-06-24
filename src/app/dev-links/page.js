import Link from 'next/link';

export default function DevLinksPage() {
  const adminLinks = [
    '/admin',
    '/admin/classes',
    '/admin/dashboard',
    '/admin/links',
    '/admin/users',
    '/admin/kpi',
    '/admin/templates',
    '/admin/schools',
    '/admin/questions',
    '/admin-v2',
    '/school-admin/dashboard',
  ];

  const testDemoLinks = [
    '/practice-stickers-demo',
    '/applets/magical-sharing-pizza',
    '/practice-move-demo',
    '/practice-hotspot-demo',
    '/practice-stickers-rearrange-demo',
    '/practice-sticks-demo',
    '/practice-dnd-demo',
    '/test-lesson',
  ];

  const toolsAndGeneratorsLinks = [
    '/template-generator',
    '/blog-generator',
    '/svg-tools',
    '/question-bank',
  ];

  const otherDashboards = [
    '/student/dashboard',
    '/teacher/dashboard',
    '/parent/dashboard',
    '/dashboard',
  ];

  const examPrepLinks = [
    '/exam-prep',
    '/exam-prep/jnvst',
  ];

  const docLinks = [
    '/docs/dynamic-templates',
    '/docs/option-pooling',
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Development & Navigation Links</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Admin Links</h2>
          <ul className="space-y-2">
            {adminLinks.map((link) => (
              <li key={link}>
                <Link href={link} className="text-gray-700 hover:text-blue-500 hover:underline">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-green-600">Test & Demo Links</h2>
          <ul className="space-y-2">
            {testDemoLinks.map((link) => (
              <li key={link}>
                <Link href={link} className="text-gray-700 hover:text-green-500 hover:underline">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">Tools & Generators</h2>
          <ul className="space-y-2">
            {toolsAndGeneratorsLinks.map((link) => (
              <li key={link}>
                <Link href={link} className="text-gray-700 hover:text-purple-500 hover:underline">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-orange-600">Dashboards</h2>
          <ul className="space-y-2">
            {otherDashboards.map((link) => (
              <li key={link}>
                <Link href={link} className="text-gray-700 hover:text-orange-500 hover:underline">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Exam Prep & Docs</h2>
          <ul className="space-y-2">
            {[...examPrepLinks, ...docLinks].map((link) => (
              <li key={link}>
                <Link href={link} className="text-gray-700 hover:text-red-500 hover:underline">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
