'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import styles from './links.module.css';

// Definition of all admin, test, and sandbox routes
const ROUTES_DIRECTORY = [
  {
    category: 'Admin Control Panels',
    title: 'Admin Curriculum Console',
    description: 'Manage curriculum tree nodes (Subjects, Topics, Chapters, Skills). Author visual/text questions and manage TTS audio generation.',
    route: '/admin',
    icon: '🛠️',
    type: 'admin'
  },
  {
    category: 'Admin Control Panels',
    title: 'V2 Curriculum Layout Editor',
    description: 'A modern visual layout editor designed for editing grade-wise and competency map layouts.',
    route: '/admin-v2',
    icon: '🗺️',
    type: 'admin'
  },
  {
    category: 'Admin Control Panels',
    title: 'Universal Template Editor',
    description: 'Build parameterized question templates with custom variables, complex derivations, and multi-option distractors.',
    route: '/admin/templates',
    icon: '📝',
    type: 'admin'
  },
  {
    category: 'Admin Control Panels',
    title: 'AI Prompt Template Generator',
    description: 'Use Gemini to prompt and generate fully structured question templates with live options testing.',
    route: '/template-generator',
    icon: '⚡',
    type: 'admin'
  },
  {
    category: 'Admin Control Panels',
    title: 'Questions Review & Audit',
    description: 'Audit, search, filter, and review all author-created or auto-generated questions stored in the database.',
    route: '/admin/questions',
    icon: '🔍',
    type: 'admin'
  },
  {
    category: 'Analytics & Management',
    title: 'Showcase Dashboard',
    description: 'Sandbox simulator to view parent, teacher, school admin, or student dashboard states with mock/real toggles.',
    route: '/admin/dashboard',
    icon: '📊',
    type: 'admin'
  },
  {
    category: 'Analytics & Management',
    title: 'KPI Performance Analytics',
    description: 'Monitor total question counts, TTS audio status, error rates, school progress, and student friction points.',
    route: '/admin/kpi',
    icon: '📈',
    type: 'admin'
  },
  {
    category: 'Analytics & Management',
    title: 'Classes & Rosters Management',
    description: 'Manage student classes, grade level associations, roster cohorts, and parent-student linkage.',
    route: '/admin/classes',
    icon: '🏫',
    type: 'admin'
  },
  {
    category: 'Analytics & Management',
    title: 'User Roster Directory',
    description: 'Create new teacher, parent, or student accounts. Bulk import user data via CSV and archive profiles.',
    route: '/admin/users',
    icon: '👥',
    type: 'admin'
  },
  {
    category: 'Analytics & Management',
    title: 'Schools Index',
    description: 'Manage educational institutions, school details, and cross-school rosters.',
    route: '/admin/schools',
    icon: '🏢',
    type: 'admin'
  },
  {
    category: 'Interactive Applets & Physics',
    title: 'Magical Sharing Pizza Applet',
    description: 'Visual sandbox demonstrating interactive fraction divisions using circular pizza slices.',
    route: '/applets/magical-sharing-pizza',
    icon: '🍕',
    type: 'applet'
  },
  {
    category: 'Interactive Applets & Physics',
    title: 'Gravity Drop Sandbox',
    description: 'Interactive experiment environment simulating object drop times, gravity acceleration, and air friction equations.',
    route: '/science/gravity-drop-lab',
    icon: '☄️',
    type: 'applet'
  },
  {
    category: 'Interactive Applets & Physics',
    title: 'Momentum Collision Sandbox',
    description: 'A physics simulation laboratory to test elastic and inelastic collisions between objects of variable masses.',
    route: '/science/momentum',
    icon: '🏎️',
    type: 'applet'
  },
  {
    category: 'Interactive Applets & Physics',
    title: 'Science Hub Portal',
    description: 'Student-facing gateway containing access links to all interactive science simulation modules.',
    route: '/science',
    icon: '🔬',
    type: 'applet'
  },
  {
    category: 'Visual Sticker & Manipulative Demos',
    title: 'Stickers Counting Canvas',
    description: 'Interactive early years counting manipulative placing stickers into jars or tables.',
    route: '/practice-stickers-demo',
    icon: '🧸',
    type: 'developer'
  },
  {
    category: 'Visual Sticker & Manipulative Demos',
    title: 'Sticker Category Sorter',
    description: 'Sticker sorting manipulative dividing items by animal class, shape, or phonic sounds.',
    route: '/practice-stickers-rearrange-demo',
    icon: '🍎',
    type: 'developer'
  },
  {
    category: 'Visual Sticker & Manipulative Demos',
    title: 'Stickers Movement & Translation',
    description: 'Early years canvas mapping sticker displacement and movement on grid coordinates.',
    route: '/practice-move-demo',
    icon: '🛸',
    type: 'developer'
  },
  {
    category: 'Visual Sticker & Manipulative Demos',
    title: 'Base-Ten Sticks Drawing',
    description: 'Visualizer for rods, blocks, cubes, and flats representing thousands, hundreds, tens, and ones.',
    route: '/practice-sticks-demo',
    icon: '📏',
    type: 'developer'
  },
  {
    category: 'Visual Sticker & Manipulative Demos',
    title: 'Drag and Drop Word Match',
    description: 'Developer workspace testing custom drag-n-drop shape matching and text alignment.',
    route: '/practice-dnd-demo',
    icon: '📦',
    type: 'developer'
  },
  {
    category: 'Visual Sticker & Manipulative Demos',
    title: 'Hotspot Click Targets',
    description: 'Canvas testing coordinate hotspots, tracking precise clicks, and evaluating margins of error.',
    route: '/practice-hotspot-demo',
    icon: '🎯',
    type: 'developer'
  },
  {
    category: 'Visual Sticker & Manipulative Demos',
    title: 'SVG and Coordinates Checker',
    description: 'A playground tool to parse, sanitize, inline, and review custom SVG vectors and coordinate maps.',
    route: '/svg-tools',
    icon: '🎨',
    type: 'developer'
  },
  {
    category: 'Student Hubs & Exam Prep',
    title: 'Entrance Exam Hub',
    description: 'Main portal hub containing entrance exam categories like JNVST or Sainik School drills.',
    route: '/exam-prep',
    icon: '🏆',
    type: 'test'
  },
  {
    category: 'Student Hubs & Exam Prep',
    title: 'JNVST Practice Portal',
    description: 'Jawahar Navodaya Vidyalaya Selection Test (MAT, Arithmetic, Language) interactive dashboard.',
    route: '/exam-prep/jnvst',
    icon: '✏️',
    type: 'test'
  },
  {
    category: 'Student Hubs & Exam Prep',
    title: 'Grades & Syllabus Index',
    description: 'Class-wise and grade-wise skill grids displaying complete syllabus masteries.',
    route: '/grades',
    icon: '📚',
    type: 'test'
  },
  {
    category: 'Student Hubs & Exam Prep',
    title: 'V2 Syllabus Grid',
    description: 'Modern redesigned landing interface for grades LKG, UKG, and primary levels.',
    route: '/grades-v2',
    icon: '🎈',
    type: 'test'
  },
  {
    category: 'Student Hubs & Exam Prep',
    title: 'Practice Shell',
    description: 'Unified student practicing screen designed to run adaptive curriculum question queues.',
    route: '/practice',
    icon: '🏁',
    type: 'test'
  },
  {
    category: 'Student Hubs & Exam Prep',
    title: 'Lesson Content Tester',
    description: 'Developer page rendering structured lessons containing explanations, inline definitions, and slides.',
    route: '/test-lesson',
    icon: '📖',
    type: 'developer'
  },
  {
    category: 'Content Generation',
    title: 'AI Blog Generator',
    description: 'Admin workspace using Gemini to write, format, optimize, and save blog posts for indexing.',
    route: '/blog-generator',
    icon: '✍️',
    type: 'admin'
  },
  {
    category: 'Content Generation',
    title: 'Public Blogs',
    description: 'Sitemap for reading published curriculum updates, feature announcements, and tutorials.',
    route: '/blog',
    icon: '📰',
    type: 'test'
  }
];

export default function AdminLinksDirectoryPage() {
  const [theme, setTheme] = useState('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Sync theme with local storage & preferences
  useEffect(() => {
    const stored = localStorage.getItem('adminTheme');
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    let nextTheme;
    if (theme === 'light') nextTheme = 'dark';
    else if (theme === 'dark') nextTheme = 'blue';
    else nextTheme = 'light';
    setTheme(nextTheme);
    localStorage.setItem('adminTheme', nextTheme);
  };

  // Filter routes based on search and selected filter chip
  const filteredRoutes = useMemo(() => {
    return ROUTES_DIRECTORY.filter(route => {
      // Filter chip match
      if (activeFilter !== 'all' && route.type !== activeFilter) {
        return false;
      }
      // Search query match
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = route.title.toLowerCase().includes(query);
        const matchesDesc = route.description.toLowerCase().includes(query);
        const matchesRoute = route.route.toLowerCase().includes(query);
        const matchesCategory = route.category.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesRoute || matchesCategory;
      }
      return true;
    });
  }, [searchQuery, activeFilter]);

  // Group filtered routes by category
  const groupedRoutes = useMemo(() => {
    const groups = {};
    filteredRoutes.forEach(route => {
      if (!groups[route.category]) {
        groups[route.category] = [];
      }
      groups[route.category].push(route);
    });
    return groups;
  }, [filteredRoutes]);

  return (
    <div className={`${styles.container} ${
      theme === 'dark' ? styles.darkMode : theme === 'blue' ? styles.blueMode : ''
    }`}>
      {/* Page Header */}
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>Application Map & Directory</h1>
          <p>Index of all admin dashboards, developer test benches, visual applets, and entrance exam portals.</p>
        </div>
        <div className={styles.controls}>
          <button onClick={toggleTheme} className={styles.themeBtn}>
            🎨 Theme: {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Ocean Blue'}
          </button>
        </div>
      </header>

      {/* Main Directory Workspace */}
      <main className={styles.mainLayout}>
        
        {/* Search & Filter section */}
        <section className={styles.searchSection}>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search directory by title, description, category, or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterChips}>
            <button 
              onClick={() => setActiveFilter('all')} 
              className={`${styles.chip} ${activeFilter === 'all' ? styles.chipActive : ''}`}
            >
              All Routes ({ROUTES_DIRECTORY.length})
            </button>
            <button 
              onClick={() => setActiveFilter('admin')} 
              className={`${styles.chip} ${activeFilter === 'admin' ? styles.chipActive : ''}`}
            >
              Admin Tools ({ROUTES_DIRECTORY.filter(r => r.type === 'admin').length})
            </button>
            <button 
              onClick={() => setActiveFilter('developer')} 
              className={`${styles.chip} ${activeFilter === 'developer' ? styles.chipActive : ''}`}
            >
              Developer Sandboxes ({ROUTES_DIRECTORY.filter(r => r.type === 'developer').length})
            </button>
            <button 
              onClick={() => setActiveFilter('applet')} 
              className={`${styles.chip} ${activeFilter === 'applet' ? styles.chipActive : ''}`}
            >
              Visual Applets ({ROUTES_DIRECTORY.filter(r => r.type === 'applet').length})
            </button>
            <button 
              onClick={() => setActiveFilter('test')} 
              className={`${styles.chip} ${activeFilter === 'test' ? styles.chipActive : ''}`}
            >
              Exams & Shells ({ROUTES_DIRECTORY.filter(r => r.type === 'test').length})
            </button>
          </div>
        </section>

        {/* Categories / Grid container */}
        {Object.keys(groupedRoutes).length > 0 ? (
          Object.entries(groupedRoutes).map(([category, items]) => (
            <div key={category} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                {category} ({items.length})
              </h2>
              <div className={styles.grid}>
                {items.map((item) => (
                  <div key={item.route} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3 className={styles.cardTitle}>{item.title}</h3>
                      </div>
                      <span className={styles.cardIcon}>{item.icon}</span>
                    </div>

                    <p className={styles.cardDesc}>{item.description}</p>

                    <div className={styles.cardMeta}>
                      <span className={`${styles.badge} ${
                        item.type === 'admin' ? styles.badgeAdmin :
                        item.type === 'developer' ? styles.badgeDeveloper :
                        item.type === 'applet' ? styles.badgeApplet :
                        styles.badgeTest
                      }`}>
                        {item.type}
                      </span>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.routeText} title={item.route}>
                        {item.route}
                      </span>
                      <Link href={item.route} className={styles.cardLink}>
                        Go to Page ›
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noResults}>
            <p>No matching routes found in directory. Try adjusting your search query or filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
