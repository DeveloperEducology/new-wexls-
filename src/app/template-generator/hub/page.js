'use client';

import React from 'react';
import Link from 'next/link';

const BUILDERS = [
  {
    title: 'Counting & Image Collections',
    description: 'Design animal counts, cupcake grids, toy collections, and count representation builders.',
    icon: '🦁',
    color: '#3b82f6',
    bg: '#eff6ff',
    link: '/template-generator/counting',
    badge: 'Grades LKG-1'
  },
  {
    title: 'Addition & Subtraction Models',
    description: 'Create interactive addition/subtraction sentences using ten frames, balance scales, and jump lines.',
    icon: '⚡',
    color: '#ea580c',
    bg: '#fff5ed',
    link: '/template-generator/addition-subtraction',
    badge: 'Grades LKG-2'
  },
  {
    title: '➗ Division & Equal Sharing',
    description: 'Design division visual representations using equal sharing rows and group distribution models.',
    icon: '📦',
    color: '#9333ea',
    bg: '#faf5ff',
    link: '/template-generator/division',
    badge: 'Grades 2-4'
  },
  {
    title: 'Base Ten Blocks & Place Value',
    description: 'Create place value chart templates, base-ten models, digit partition, and representation builders.',
    icon: '🧱',
    color: '#4f46e5',
    bg: '#f5f3ff',
    link: '/template-generator/place-value',
    badge: 'Grades 1-3'
  },
  {
    title: 'Fractions & Shading Models',
    description: 'Design fraction circles, chocolate bars, fraction grids, and shaded area representations.',
    icon: '🍕',
    color: '#f59e0b',
    bg: '#fffbeb',
    link: '/template-generator/fractions',
    badge: 'Grades 2-5'
  },
  {
    title: 'Analog Clocks & Calendars',
    description: 'Build clock reading layouts, interactive hands coordinates, calendar schedules, and time offsets.',
    icon: '⏰',
    color: '#10b981',
    bg: '#f0fdf4',
    link: '/template-generator/time',
    badge: 'Grades 1-3'
  },
  {
    title: '🎲 Probability & Spinners',
    description: 'Design spinner sections, jar of marbles drawings, likelihood metrics, and fractional outcomes.',
    icon: '🎲',
    color: '#e11d48',
    bg: '#fff1f2',
    link: '/template-generator/probability',
    badge: 'Grades 3-5'
  },
  {
    title: 'Spreadsheet Grid Generator',
    description: 'Define custom rows of variables and direct values using a structured spreadsheet grid.',
    icon: '📊',
    color: '#ec4899',
    bg: '#fdf2f8',
    link: '/template-generator-grid',
    badge: 'JNVST & Grade 1-5'
  },
  {
    title: 'Universal Template Builder',
    description: 'Access the classic, multi-dropdown universal template generator containing all components.',
    icon: '⚙️',
    color: '#64748b',
    bg: '#f8fafc',
    link: '/template-generator',
    badge: 'Legacy'
  }
];

export default function TemplateGeneratorHub() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 24px'
    }}>
      {/* Container */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <header style={{
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>🎓</span>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 850,
            color: '#0f172a',
            margin: '0 0 8px',
            letterSpacing: '-0.02em'
          }}>
            Template Masterclass Hub
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            margin: 0,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Select a specialized dynamic math builder optimized for your topic. Create, test, and publish template recipes to the database.
          </p>
        </header>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {BUILDERS.map((builder, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '24px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div>
                {/* Header info */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <span style={{
                    fontSize: '36px',
                    background: builder.bg,
                    padding: '12px',
                    borderRadius: '16px',
                    display: 'inline-block'
                  }}>
                    {builder.icon}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: builder.color,
                    background: builder.bg,
                    padding: '6px 12px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {builder.badge}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '0 0 10px'
                }}>
                  {builder.title}
                </h3>
                
                <p style={{
                  fontSize: '14.5px',
                  color: '#64748b',
                  lineHeight: '1.6',
                  margin: '0 0 24px'
                }}>
                  {builder.description}
                </p>
              </div>

              <Link href={builder.link} style={{
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center',
                background: builder.color,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14.5px',
                padding: '12px 18px',
                borderRadius: '14px',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Launch Builder →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
