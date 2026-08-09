import React from 'react';
import Link from 'next/link';
import PreviewWidget from '@/components/seo/PreviewWidget';
import { getSeoTopicBySlug } from '@/lib/seo/seoTopicsStore';
import { getSeoPreviewQuestions } from '@/lib/seo/previewGenerator';
import LessonRenderer from '@/components/seo/LessonRenderer';

// ── Topic display name map ──────────────────────────────────────────────────
// Maps slug keywords to human-readable display names.
const TOPIC_DISPLAY_NAMES = {
  'template-time-distance-dist-calc':  'Calculate Distance from Speed & Time',
  'template-time-distance-speed-calc': 'Calculate Speed from Distance & Time',
  'template-time-distance-time-calc':  'Calculate Time from Distance & Speed',
  'template-time-distance-kmh-to-ms':  'Convert km/h ↔ m/s',
  'template-fraction-visual-id':       'Identify Fractions from Visual Models',
  'template-fraction-classify':        'Classify Fractions (Proper, Improper, Mixed)',
  'template-fraction-add':             'Add Fractions',
  'template-fraction-subtract':        'Subtract Fractions',
  'template-fraction-compare':         'Compare and Order Fractions',
  'template-ratios-equivalence':       'Equivalent Ratios',
  'template-ratios-simplification':    'Simplify Ratios',
  'template-simple-interest-calc':     'Calculate Simple Interest',
  'template-percentage-change':        'Percentage Increase & Decrease',
  'template-percentage-of-value':      'Find Percentage of a Number',
  'template-lcm-hcf-lcm-basic':        'Find LCM of Numbers',
  'template-lcm-hcf-hcf-basic':        'Find HCF of Numbers',
  'template-mensuration-area-rect':    'Area of Rectangle & Square',
  'template-mensuration-perimeter':    'Perimeter of 2D Shapes',
  'template-mensuration-triangle-area':'Area of Triangle',
};

// ── Related topics map ─────────────────────────────────────────────────────
const RELATED_TOPICS = {
  'time-distance': [
    { slug: 'template-time-distance-dist-calc',  label: 'Calculate Distance' },
    { slug: 'template-time-distance-speed-calc', label: 'Calculate Speed' },
    { slug: 'template-time-distance-time-calc',  label: 'Calculate Time' },
    { slug: 'template-time-distance-kmh-to-ms',  label: 'km/h ↔ m/s' },
  ],
  'fraction': [
    { slug: 'template-fraction-visual-id',   label: 'Visual Fractions' },
    { slug: 'template-fraction-classify',    label: 'Classify Fractions' },
    { slug: 'template-fraction-add',         label: 'Add Fractions' },
    { slug: 'template-fraction-subtract',    label: 'Subtract Fractions' },
    { slug: 'template-fraction-compare',     label: 'Compare Fractions' },
  ],
  'ratio': [
    { slug: 'template-ratios-equivalence',    label: 'Equivalent Ratios' },
    { slug: 'template-ratios-simplification', label: 'Simplify Ratios' },
  ],
  'percent': [
    { slug: 'template-percentage-change',    label: '% Increase & Decrease' },
    { slug: 'template-percentage-of-value',  label: '% of a Number' },
  ],
  'interest': [
    { slug: 'template-simple-interest-calc', label: 'Simple Interest' },
  ],
  'lcm': [
    { slug: 'template-lcm-hcf-lcm-basic', label: 'LCM' },
    { slug: 'template-lcm-hcf-hcf-basic', label: 'HCF' },
  ],
  'mensuration': [
    { slug: 'template-mensuration-area-rect',     label: 'Area of Rect/Square' },
    { slug: 'template-mensuration-perimeter',     label: 'Perimeter' },
    { slug: 'template-mensuration-triangle-area', label: 'Area of Triangle' },
  ],
};

/** Gets the human-readable topic display name from the slug. */
function getTopicDisplayName(slug) {
  if (TOPIC_DISPLAY_NAMES[slug]) return TOPIC_DISPLAY_NAMES[slug];
  // Fallback: strip "template-" prefix and title-case each word
  return String(slug)
    .replace(/^template-/, '')
    .split(/-/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Gets the related topic group for the given slug. */
function getRelatedTopics(examName, subject, topicSlug) {
  for (const [key, topics] of Object.entries(RELATED_TOPICS)) {
    if (topicSlug.includes(key)) {
      return topics.filter(t => t.slug !== topicSlug).map(t => ({
        ...t,
        href: `/exams/${examName}/${subject}/${t.slug}`,
      }));
    }
  }
  return [];
}

/** Gets the JNVST section for a topic slug to link to the correct practice filter. */
function getPracticeSection(topicSlug) {
  if (topicSlug.includes('time-distance') || topicSlug.includes('percent') ||
      topicSlug.includes('interest') || topicSlug.includes('lcm') ||
      topicSlug.includes('mensuration') || topicSlug.includes('ratio')) {
    return 'arithmetic';
  }
  return 'arithmetic';
}

// ── SEO Metadata ────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { examName, subject, topic } = await params;

  let dbTopic = null;
  try {
    dbTopic = await getSeoTopicBySlug(topic, examName);
  } catch (_) {}

  const formattedExam = String(examName || '').toUpperCase();
  const formattedSubject = String(subject || '').charAt(0).toUpperCase() + String(subject || '').slice(1);
  const displayTopic = dbTopic?.displayName || getTopicDisplayName(topic || '');

  const title = dbTopic?.metaTitle || `${formattedExam} Class 6 ${formattedSubject}: ${displayTopic} | KlassChamp`;
  const description = dbTopic?.metaDescription || `Free online practice for ${formattedExam} Class 6 ${formattedSubject} — ${displayTopic}. Try 3 interactive sample questions with step-by-step explanations. No login required.`;
  const keywords = dbTopic?.metaKeywords || '';

  const metaObj = {
    title,
    description,
    alternates: {
      canonical: `https://klasschamp.com/exams/${examName}/${subject}/${topic}`,
    },
    openGraph: {
      title: `${formattedExam} ${formattedSubject}: ${displayTopic} Practice`,
      description: `Free JNVST practice questions for ${displayTopic}. Instant feedback & detailed explanations.`,
      url: `https://klasschamp.com/exams/${examName}/${subject}/${topic}`,
      siteName: 'KlassChamp',
      type: 'website',
    },
  };

  if (keywords) {
    metaObj.keywords = keywords;
  }

  return metaObj;
}

// ── Default Lesson Plan Generator ──────────────────────────────────────────
function getDefaultLessonJson(topicSlug, displayTopic) {
  const slug = String(topicSlug || '').toLowerCase();
  
  if (slug.includes('ratios-equivalence') || slug.includes('equivalent-ratios')) {
    return {
      sections: [
        {
          type: "introduction",
          heading: "What are Equivalent Ratios?",
          content: "Ratios compare two quantities. **Equivalent ratios** are ratios that name the same comparison, even if the numbers look different. They have the same value when simplified.",
          callout: {
            title: "💡 Friendly Rule",
            text: "Two ratios are equivalent if their fraction forms are equal. For example, $1:2$ and $2:4$ are equivalent because $\\frac{1}{2} = \\frac{2}{4}$."
          }
        },
        {
          type: "visual-grid",
          heading: "Visualizing Equivalent Ratios",
          description: "Notice how the shaded portions represent the same fraction of the total grid, showing that $2:3$ is equivalent to $4:6$:",
          table: {
            headers: ["Ratio", "Visual Representation", "Simplified Form"],
            rows: [
              ["2 : 3", "🔵 🔵 ⚪ (2 out of 3 shaded)", "$\\frac{2}{3}$"],
              ["4 : 6", "🔵 🔵 🔵 🔵 ⚪ ⚪ (4 out of 6 shaded)", "$\\frac{4 \\div 2}{6 \\div 2} = \\frac{2}{3}$"]
            ]
          }
        },
        {
          type: "worked-example",
          heading: "Worked Example: Finding the Missing Value",
          prompt: "Find the missing term to make the ratios equivalent: $3 : 5 = 12 : ?$",
          steps: [
            {
              stepNumber: 1,
              instruction: "Write the equivalent ratios as a fraction equation:",
              formula: "\\frac{3}{5} = \\frac{12}{x}"
            },
            {
              stepNumber: 2,
              instruction: "Identify the multiplication factor going from the first numerator ($3$) to the second ($12$):",
              formula: "3 \\times 4 = 12"
            },
            {
              stepNumber: 3,
              instruction: "Multiply the denominator ($5$) by the same factor ($4$) to find the missing value $x$:",
              formula: "x = 5 \\times 4 = 20"
            }
          ],
          pitfall: {
            title: "⚠️ Common Mistake",
            text: "Never add or subtract numbers to find equivalent ratios! For example, $3:5$ is NOT equivalent to $4:6$ (even though $+1$ was added to both numbers)."
          }
        }
      ]
    };
  }

  if (slug.includes('associative-property')) {
    return {
      sections: [
        {
          type: "introduction",
          heading: "What is the Associative Property?",
          content: "The **associative property** says that you can group numbers in different ways using parentheses without changing the final answer. This property holds true for **addition** and **multiplication**.",
          callout: {
            title: "⚠️ Subtraction & Division Warning",
            text: "The associative property does NOT apply to subtraction or division! Grouping numbers differently will change the answer."
          }
        },
        {
          type: "rule-box",
          heading: "Associative Property Formulas",
          bullets: [
            "**Addition**: $(a + b) + c = a + (b + c)$",
            "**Multiplication**: $(a \\times b) \\times c = a \\times (b \\times c)$"
          ]
        },
        {
          type: "worked-example",
          heading: "Worked Example: Strategic Grouping",
          prompt: "Evaluate the product: $3 \\times (5 \\times 8)$",
          steps: [
            {
              stepNumber: 1,
              instruction: "Normally you would multiply left to right, but grouping differently makes it simpler:",
              formula: "3 \\times (5 \\times 8) = 3 \\times 40"
            },
            {
              stepNumber: 2,
              instruction: "Now, multiply by the friendly multiple of ten:",
              formula: "3 \\times 40 = 120"
            }
          ],
          pitfall: {
            title: "💡 Pro Tip",
            text: "Use grouping to combine numbers that make 10, 100, or a multiple of 10 first to make mental calculation much faster!"
          }
        }
      ]
    };
  }

  if (slug.includes('simple-interest')) {
    return {
      sections: [
        {
          type: "introduction",
          heading: "Understanding Simple Interest",
          content: "Simple interest is the interest calculated only on the principal amount (the original sum of money borrowed or invested) for a specific period of time.",
          callout: {
            title: "🏷️ Key Terms",
            text: "• **Principal (P)**: The initial sum of money.\\n• **Rate (R)**: The annual interest rate in percent.\\n• **Time (T)**: The duration of the loan or investment in years."
          }
        },
        {
          type: "rule-box",
          heading: "The Simple Interest Formula",
          bullets: [
            "**Simple Interest**: $SI = \\frac{P \\times R \\times T}{100}$",
            "**Total Amount**: $A = P + SI$"
          ]
        },
        {
          type: "worked-example",
          heading: "Worked Example: Calculating SI",
          prompt: "Find the simple interest on ₹1,000 at 5% per year for 3 years.",
          steps: [
            {
              stepNumber: 1,
              instruction: "Substitute the given values into the formula: $P = 1000$, $R = 5$, $T = 3$:",
              formula: "SI = \\frac{1000 \\times 5 \\times 3}{100}"
            },
            {
              stepNumber: 2,
              instruction: "Simplify the calculation by cancelling zeroes in the numerator and denominator:",
              formula: "SI = 10 \\times 5 \\times 3 = 150"
            }
          ],
          pitfall: {
            title: "⚠️ Common Mistake",
            text: "Make sure the time $T$ is in years! If the question gives time in months (e.g. 6 months), divide it by 12 to convert it to years (e.g. $T = \\frac{6}{12} = 0.5$ years)."
          }
        }
      ]
    };
  }

  // Generic fallback lesson structure
  return {
    sections: [
      {
        type: "introduction",
        heading: `Mastering ${displayTopic}`,
        content: `Practice and master **${displayTopic}**, a core topic in JNVST Class 6 Arithmetic. Understanding this concept builds a strong foundation for speed, precision, and top marks.`,
      },
      {
        type: "rule-box",
        heading: "Important Study Points",
        bullets: [
          "Carefully review the question structure and options.",
          "Check step-by-step solutions to identify shortcuts and common calculation pitfalls.",
          "Use the interactive topic practice preview on the right sidebar to test your readiness."
        ]
      }
    ]
  };
}

// ── Page Component ──────────────────────────────────────────────────────────
export default async function SeoLandingPage({ params, searchParams }) {
  const { examName, subject, topic } = await params;
  const sp = await searchParams;
  const isDev = sp?.dev === 'true';

  // Try DB first (data saved via /seo-manager), fall back to code maps
  let dbTopic = null;
  try { dbTopic = await getSeoTopicBySlug(topic, examName); } catch (_) {}

  const questions = await getSeoPreviewQuestions(
    examName, subject, topic,
    dbTopic?.fallbackQuestions?.length ? dbTopic.fallbackQuestions : null
  );

  const displayExam    = String(examName).toUpperCase();
  const displaySubject = String(subject).charAt(0).toUpperCase() + String(subject).slice(1);
  // DB displayName takes priority over code map
  const displayTopic   = dbTopic?.displayName || getTopicDisplayName(topic);
  // DB related topics take priority over code map
  const relatedTopics  = dbTopic?.relatedTopics?.length
    ? dbTopic.relatedTopics.map(rt => ({ ...rt, href: `/exams/${examName}/${subject}/${rt.slug}` }))
    : getRelatedTopics(examName, subject, topic);
  const practiceSection = getPracticeSection(topic);

  // Breadcrumb items
  const breadcrumbs = [
    { label: 'Home',           href: '/' },
    { label: 'JNVST Prep',    href: `/exam-prep/${examName}` },
    { label: displaySubject,   href: `/exam-prep/${examName}/topics?section=${practiceSection}` },
    { label: displayTopic,     href: null },
  ];

  const getExamDescription = () => {
    if (displayExam === 'JNVST') {
      return `The Jawahar Navodaya Vidyalaya Selection Test (JNVST) targets mental ability, arithmetic, and language skills. Practice "${displayTopic}" to build speed and accuracy for this competitive exam.`;
    }
    if (displayExam === 'IMO') {
      return `The International Mathematics Olympiad (IMO) evaluates logical and mathematical reasoning. Master "${displayTopic}" with these topic-specific practice questions.`;
    }
    return `Practice ${displayExam} ${displaySubject} — ${displayTopic}. Build speed, accuracy, and confidence.`;
  };

  // JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    'name': `${displayExam} ${displaySubject}: ${displayTopic}`,
    'description': getExamDescription(),
    'url': `https://klasschamp.com/exams/${examName}/${subject}/${topic}`,
    'provider': {
      '@type': 'Organization',
      'name': 'KlassChamp',
      'url': 'https://klasschamp.com',
    },
    'educationalLevel': 'Class 6',
    'teaches': displayTopic,
  };

  return (
    <div className="seo-landing-wrapper">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* ── Navbar ── */}
      <header className="seo-nav">
        <div className="logo-container">
          <Link href="/">
            <span className="logo-text">Klass<span className="logo-accent">Champ</span></span>
          </Link>
        </div>
        <nav className="seo-nav-links">
          <Link href={`/exam-prep/${examName}`} className="nav-link">Dashboard</Link>
          <Link href={`/exam-prep/${examName}/topics`} className="nav-link">Practice</Link>
          <Link href={`/exam-prep/${examName}/mock-test`} className="nav-link nav-link-primary">Mock Test</Link>
        </nav>
      </header>

      {/* ── Breadcrumb ── */}
      <div className="breadcrumb-bar">
        <div className="breadcrumb-inner">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="breadcrumb-item">
              {i > 0 && <span className="breadcrumb-sep">›</span>}
              {crumb.href
                ? <Link href={crumb.href} className="breadcrumb-link">{crumb.label}</Link>
                : <span className="breadcrumb-current">{crumb.label}</span>
              }
            </span>
          ))}
        </div>
      </div>

      <main className="seo-main-content">
        <div className="seo-layout">
          {/* ── Main column ── */}
          <div className="seo-main-col">
            {/* Lesson Header */}
            <div className="lesson-header">
              <div className="badge">{displayExam} Study Explainer</div>
              <h1 className="lesson-title">{displayExam} Class 6 {displaySubject}: {displayTopic}</h1>
              <p className="lesson-subtitle">{dbTopic?.description || getExamDescription()}</p>
            </div>

            {/* Lesson Body */}
            <LessonRenderer lessonJson={dbTopic?.lessonJson || getDefaultLessonJson(topic, displayTopic)} />

            {/* Why KlassChamp */}
            <section className="curriculum-info">
              <h2>Why practice {displayTopic} on KlassChamp?</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <h4>🎯 Adaptive Questions</h4>
                  <p>Our smart engine adjusts to your child's skill levels to ensure they stay motivated and challenged.</p>
                </div>
                <div className="feature-card">
                  <h4>📊 Detailed Analytics</h4>
                  <p>Get topic-by-topic breakdowns identifying weak regions and recommending specific revision mock tests.</p>
                </div>
                <div className="feature-card">
                  <h4>🎨 Interactive Visuals</h4>
                  <p>Fractions, place value charts, and mental patterns are rendered with colored bars, counters, and grids.</p>
                </div>
              </div>
            </section>
          </div>

          {/* ── Sidebar ── */}
          <aside className="seo-sidebar">
            {/* Primary CTA Block */}
            <div className="sidebar-card sidebar-cta-card">
              <h4 className="sidebar-cta-title">Ready to master this skill?</h4>
              <p className="sidebar-cta-desc">Practice 1,000+ interactive JNVST questions with step-by-step help.</p>
              <Link
                href={`/exam-prep/${examName}/topics?section=${practiceSection}`}
                className="sidebar-cta-btn-primary"
              >
                🚀 Start Full Practice →
              </Link>
            </div>

            {/* Preview Widget */}
            <div className="sidebar-card preview-sidebar-card">
              <h4 className="sidebar-title">📝 Interactive Preview</h4>
              <p className="sidebar-preview-desc">Solve these 3 practice questions to check your readiness:</p>
              <div style={{ marginTop: '16px' }}>
                <PreviewWidget questions={questions} examName={examName} />
              </div>
            </div>

            {/* Related Topics */}
            {relatedTopics.length > 0 && (
              <div className="sidebar-card">
                <h4 className="sidebar-title">Related Topics</h4>
                <ul className="sidebar-list">
                  {relatedTopics.map(rt => (
                    <li key={rt.slug}>
                      <Link href={rt.href} className="sidebar-link">
                        {rt.label} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Debug section — only visible with ?dev=true */}
            {isDev && (
              <div className="sidebar-card dev-card">
                <details className="json-details">
                  <summary className="json-summary">
                    <span>🔍 DEV: Questions JSON</span>
                  </summary>
                  <div className="json-content">
                    <pre><code>{JSON.stringify(questions, null, 2)}</code></pre>
                  </div>
                </details>
              </div>
            )}
          </aside>
        </div>
      </main>

      <footer className="seo-footer">
        <p>© {new Date().getFullYear()} KlassChamp. All rights reserved.</p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .seo-landing-wrapper {
          background-color: #ffffff;
          color: #0f172a;
          min-height: 100vh;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* ── Navbar ── */
        .seo-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 5%;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .logo-text {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #0f172a;
          text-decoration: none;
        }
        .logo-accent { color: #0284c7; }
        .seo-nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-link {
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .nav-link:hover { color: #0284c7; background: #f0f9ff; }
        .nav-link-primary {
          background: #0284c7;
          color: #ffffff !important;
          padding: 8px 18px;
        }
        .nav-link-primary:hover { background: #0369a1 !important; }

        /* ── Breadcrumb ── */
        .breadcrumb-bar {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 10px 5%;
        }
        .breadcrumb-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 2px;
          font-size: 13px;
        }
        .breadcrumb-item { display: flex; align-items: center; }
        .breadcrumb-sep { color: #94a3b8; margin: 0 4px; }
        .breadcrumb-link {
          color: #0284c7;
          text-decoration: none;
          font-weight: 500;
        }
        .breadcrumb-link:hover { text-decoration: underline; }
        .breadcrumb-current { color: #64748b; font-weight: 500; }

        /* ── Layout ── */
        .seo-main-content {
          padding: 40px 5% 80px 5%;
          max-width: 1200px;
          margin: 0 auto;
        }
        .seo-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 40px;
          align-items: start;
        }
        .seo-main-col { min-width: 0; }

        /* ── Lesson Header ── */
        .lesson-header {
          margin-bottom: 30px;
          text-align: left;
        }
        .lesson-title {
          font-size: 32px;
          font-weight: 900;
          line-height: 1.25;
          margin: 8px 0 12px 0;
          letter-spacing: -0.5px;
          color: #0f172a;
        }
        .lesson-subtitle {
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
          margin: 0;
        }

        .badge {
          display: inline-block;
          background: rgba(2, 132, 199, 0.08);
          color: #0284c7;
          border: 1px solid rgba(2, 132, 199, 0.15);
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ── Debug (dev only) ── */
        .json-debug-section { margin-top: 24px; text-align: left; }
        .json-details {
          background: #ffffff;
          border: 1px solid #fbbf24;
          border-radius: 12px;
          overflow: hidden;
        }
        .json-summary {
          padding: 12px 20px;
          font-weight: 700;
          color: #d97706;
          background: #fffbeb;
          cursor: pointer;
          font-size: 13px;
          list-style: none;
        }
        .json-content { padding: 0 20px 20px 20px; }
        .json-content pre {
          margin: 12px 0 0 0;
          padding: 15px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow-x: auto;
          font-family: 'Fira Code', monospace;
          font-size: 12px;
          line-height: 1.5;
          color: #0f172a;
          max-height: 400px;
        }

        /* ── Why KlassChamp ── */
        .curriculum-info {
          border-top: 1.5px solid #f1f5f9;
          padding-top: 40px;
          margin-top: 48px;
          text-align: left;
        }
        .curriculum-info h2 {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 24px;
          color: #0f172a;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }
        .feature-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          text-align: left;
          transition: all 0.25s ease;
        }
        .feature-card:hover {
          background: #f0f9ff;
          border-color: #bae6fd;
          transform: translateY(-2px);
        }
        .feature-card h4 { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .feature-card p  { font-size: 12px; line-height: 1.5; color: #475569; }

        /* ── Sidebar ── */
        .seo-sidebar {
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sidebar-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01);
        }
        .sidebar-title {
          font-size: 13px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 6px;
        }
        .sidebar-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sidebar-link {
          display: block;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #0284c7;
          text-decoration: none;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        .sidebar-link:hover {
          background: #f0f9ff;
          border-color: #bae6fd;
          transform: translateX(2px);
        }
        .sidebar-cta-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border: none;
          box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.15);
        }
        .sidebar-cta-title {
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 6px;
        }
        .sidebar-cta-desc {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 16px;
        }
        .sidebar-cta-btn-primary {
          display: block;
          text-align: center;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: #ffffff;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
          transition: all 0.2s ease;
        }
        .sidebar-cta-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.35);
        }
        
        .preview-sidebar-card {
          padding: 16px;
        }
        .sidebar-preview-desc {
          font-size: 12.5px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        /* ── Footer ── */
        .seo-footer {
          text-align: center;
          padding: 40px 0;
          border-top: 1px solid #e2e8f0;
          color: #94a3b8;
          font-size: 13px;
          margin-top: 60px;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .seo-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .seo-sidebar {
            position: static;
            width: 100%;
          }
        }
        @media (max-width: 600px) {
          .lesson-title { font-size: 26px; }
          .seo-nav-links .nav-link:not(.nav-link-primary) { display: none; }
        }
      `}} />
    </div>
  );
}
