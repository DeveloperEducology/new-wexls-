import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import SvgDiagram from './SvgDiagram';

function renderMathText(text) {
  if (!text) return '';
  const str = String(text);
  
  // Split by inline math, block math, and diagram macros [diagram:type:params]
  const parts = str.split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\[diagram:[^\]]+?\])/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch { return <span key={i}>{part}</span>; }
    } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        return <div key={i} dangerouslySetInnerHTML={{ __html: html }} style={{ margin: '12px 0' }} />;
      } catch { return <div key={i}>{part}</div>; }
    } else if (part.startsWith('$$') && part.endsWith('$$')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        return <div key={i} dangerouslySetInnerHTML={{ __html: html }} style={{ margin: '12px 0' }} />;
      } catch { return <div key={i}>{part}</div>; }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const formula = part.slice(1, -1);
      try {
        const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch { return <span key={i}>{part}</span>; }
    } else if (part.startsWith('[diagram:') && part.endsWith(']')) {
      const pieces = part.slice(9, -1).split(':');
      const diagType = pieces[0];
      const diagParams = {};
      
      try {
        if (diagType === 'fraction-pie' || diagType === 'fraction-bar') {
          const [num, den] = pieces[1].split('/');
          diagParams.numerator = num;
          diagParams.denominator = den;
        } else if (diagType === 'number-line') {
          const [range, val] = pieces[1].split('=');
          const [min, max] = range.split('-');
          diagParams.min = min;
          diagParams.max = max;
          diagParams.value = val;
        } else if (diagType === 'place-value') {
          const [h, t, o] = pieces[1].split(',');
          diagParams.hundreds = h;
          diagParams.tens = t;
          diagParams.ones = o;
        } else if (diagType === 'geometry-shape') {
          diagParams.shape = pieces[1];
          diagParams.label1 = pieces[2] || '';
          diagParams.label2 = pieces[3] || '';
          diagParams.label3 = pieces[4] || '';
        } else if (diagType === 'percentage-grid') {
          diagParams.percent = parseInt(pieces[1] || '0', 10);
        } else if (diagType === 'clock') {
          diagParams.time = `${pieces[1] || '10'}:${pieces[2] || '15'}`;
        } else if (diagType === 'bar-comparison') {
          diagParams.value1 = parseFloat(pieces[1] || '200');
          diagParams.value2 = parseFloat(pieces[2] || '250');
          diagParams.label1 = pieces[3] || 'Cost Price';
          diagParams.label2 = pieces[4] || 'Selling Price';
        } else if (diagType === 'arithmetic-visual') {
          diagParams.operation = pieces[1] || 'addition';
          diagParams.value1 = parseInt(pieces[2] || '5', 10);
          diagParams.value2 = parseInt(pieces[3] || '3', 10);
          diagParams.itemType = pieces[4] || 'emoji';
          diagParams.itemSource = pieces[5] || '🍎';
        }
        return <SvgDiagram key={i} type={diagType} params={diagParams} />;
      } catch (err) {
        return <span key={i} style={{ color: 'red', fontWeight: 'bold' }}>[Invalid Diagram: {part}]</span>;
      }
    }
    
    // Replace strong formatting (**text**)
    const subParts = part.split(/(\*\*.*?\*\*)/g);
    return subParts.map((sub, j) => {
      if (sub.startsWith('**') && sub.endsWith('**')) {
        return <strong key={j}>{sub.slice(2, -2)}</strong>;
      }
      return sub;
    });
  });
}

export default function LessonRenderer({ lessonJson }) {
  if (!lessonJson || !Array.isArray(lessonJson.sections)) return null;

  return (
    <div className="lesson-container">
      {lessonJson.sections.map((section, idx) => {
        switch (section.type) {
          case 'introduction':
            return (
              <section key={idx} className="lesson-section intro-section">
                {section.heading && <h2>{section.heading}</h2>}
                <p className="section-p">{renderMathText(section.content)}</p>
                {section.callout && (
                  <div className="lesson-callout info-callout">
                    <h4 className="callout-title">{section.callout.title}</h4>
                    <p className="callout-text">{renderMathText(section.callout.text)}</p>
                  </div>
                )}
              </section>
            );

          case 'visual-grid':
            return (
              <section key={idx} className="lesson-section grid-section">
                {section.heading && <h2>{section.heading}</h2>}
                {section.description && <p className="section-p">{renderMathText(section.description)}</p>}
                {section.table && (
                  <div className="lesson-table-wrapper">
                    <table className="lesson-table">
                      <thead>
                        <tr>
                          {section.table.headers.map((h, i) => (
                            <th key={i}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j}>{renderMathText(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );

          case 'worked-example':
            return (
              <section key={idx} className="lesson-section example-section">
                {section.heading && <h2>{section.heading}</h2>}
                <div className="example-box">
                  <div className="example-prompt">
                    <span className="example-badge">Prompt</span>
                    <p className="prompt-text">{renderMathText(section.prompt)}</p>
                  </div>
                  {section.steps && (
                    <div className="example-timeline">
                      {section.steps.map((s, i) => (
                        <div key={i} className="timeline-item">
                          <div className="timeline-marker">{s.stepNumber || (i + 1)}</div>
                          <div className="timeline-content">
                            <p className="step-text">{renderMathText(s.instruction)}</p>
                            {s.formula && (
                              <div className="step-formula">
                                {renderMathText(`$$${s.formula}$$`)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.pitfall && (
                    <div className="lesson-callout warning-callout">
                      <h4 className="callout-title">{section.pitfall.title}</h4>
                      <p className="callout-text">{renderMathText(section.pitfall.text)}</p>
                    </div>
                  )}
                </div>
              </section>
            );

          case 'rule-box':
            return (
              <section key={idx} className="lesson-section rule-section">
                {section.heading && <h2>{section.heading}</h2>}
                <div className="rule-card">
                  {section.bullets && (
                    <ul className="rule-list">
                      {section.bullets.map((b, i) => (
                        <li key={i}>{renderMathText(b)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            );

          case 'image':
            return (
              <section key={idx} className="lesson-section image-section" style={{ textAlign: section.alignment || 'center' }}>
                <div className="lesson-image-wrapper">
                  <img
                    src={section.src || 'https://placehold.co/600x400?text=No+Image+URL'}
                    alt={section.alt || ''}
                    style={{
                      width: section.width || '300px',
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      display: 'inline-block'
                    }}
                  />
                  {section.caption && (
                    <p className="lesson-image-caption">
                      {renderMathText(section.caption)}
                    </p>
                  )}
                </div>
              </section>
            );

          case 'diagram':
            return (
              <section key={idx} className="lesson-section diagram-section" style={{ textAlign: section.alignment || 'center' }}>
                {section.heading && <h2>{section.heading}</h2>}
                {section.description && <p className="section-p">{renderMathText(section.description)}</p>}
                <div className="lesson-diagram-wrapper" style={{ margin: '20px 0' }}>
                  <SvgDiagram type={section.diagramType} params={section.params} />
                  {section.caption && (
                    <p className="lesson-image-caption" style={{ textAlign: section.alignment || 'center', fontSize: '13px', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>
                      {renderMathText(section.caption)}
                    </p>
                  )}
                </div>
              </section>
            );

          default:
            return null;
        }
      })}

      <style dangerouslySetInnerHTML={{ __html: `
        .lesson-container {
          display: flex;
          flex-direction: column;
          gap: 40px;
          margin-top: 20px;
        }

        .lesson-section {
          animation: fadeIn 0.4s ease;
        }

        .lesson-section h2 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 16px 0;
          letter-spacing: -0.5px;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 8px;
        }

        .section-p {
          font-size: 16px;
          line-height: 1.7;
          color: #334155;
          margin: 0 0 16px 0;
        }

        /* ── Callout Box ── */
        .lesson-callout {
          border-left: 4px solid;
          border-radius: 8px;
          padding: 16px 20px;
          margin: 16px 0;
        }
        .info-callout {
          background: #f0f9ff;
          border-color: #0284c7;
        }
        .warning-callout {
          background: #fffbeb;
          border-color: #d97706;
        }
        .callout-title {
          font-size: 15px;
          font-weight: 800;
          margin: 0 0 6px 0;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .callout-text {
          font-size: 14px;
          line-height: 1.6;
          color: #475569;
          margin: 0;
        }

        /* ── Timeline Worked Example ── */
        .example-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .example-prompt {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #f8fafc;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .example-badge {
          background: #0284c7;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }
        .prompt-text {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
          line-height: 1.5;
        }
        .example-timeline {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          padding-left: 16px;
          margin-bottom: 20px;
        }
        .example-timeline::before {
          content: '';
          position: absolute;
          left: 31px;
          top: 15px;
          bottom: 15px;
          width: 2px;
          background: #e2e8f0;
        }
        .timeline-item {
          display: flex;
          gap: 20px;
          position: relative;
        }
        .timeline-marker {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e0f2fe;
          color: #0284c7;
          font-weight: 800;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          flex-shrink: 0;
          box-shadow: 0 0 0 4px #ffffff;
        }
        .timeline-content {
          padding-top: 5px;
          flex-grow: 1;
          min-width: 0;
        }
        .step-text {
          font-size: 15px;
          color: #334155;
          margin: 0 0 8px 0;
          line-height: 1.6;
          word-break: break-word;
        }
        .step-formula {
          background: #fafafa;
          border: 1px dashed #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          display: block;
          max-width: 100%;
          overflow-x: auto;
          box-sizing: border-box;
        }

        /* ── Tables ── */
        .lesson-table-wrapper {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin: 16px 0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01);
        }
        .lesson-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
        }
        .lesson-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 800;
          padding: 12px 16px;
          border-bottom: 1.5px solid #e2e8f0;
        }
        .lesson-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }
        .lesson-table tr:last-child td {
          border-bottom: none;
        }
        .lesson-table tr:nth-child(even) {
          background: #fafafa;
        }

        /* ── Rule Box ── */
        .rule-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px 24px;
        }
        .rule-list {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rule-list li {
          font-size: 15px;
          line-height: 1.6;
          color: #334155;
        }

        /* ── Image Blocks ── */
        .lesson-image-wrapper {
          margin: 24px 0;
          display: inline-block;
          max-width: 100%;
        }
        .lesson-image-caption {
          font-size: 13px;
          color: #64748b;
          margin-top: 10px;
          font-style: italic;
          line-height: 1.4;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Prevent KaTeX math overflow */
        .katex-display {
          overflow-x: auto !important;
          overflow-y: hidden !important;
          max-width: 100% !important;
          padding: 4px 0;
        }
        .katex {
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          vertical-align: middle;
        }
      `}} />
    </div>
  );
}
