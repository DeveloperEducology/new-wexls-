'use client';

import React, { useEffect, useState } from 'react';
import { listSvgTools, resolveToolSvg } from '@/lib/practice/svgTools';
import InteractiveToolWrapper from '@/components/practice/InteractiveToolWrapper';

export default function SvgToolsPreviewPage() {
  const tools = listSvgTools();

  useEffect(() => {
    document.title = 'SVG Tools Preview';
  }, []);

  // Local state to keep track of dynamic tool values in the preview route
  const [previewValues, setPreviewValues] = useState({
    inch_ruler: 4,
    centimeter_ruler: 8,
    measuring_tape: 7,
    protractor: 60,
    compass: 4,
    thermometer: 20,
    thermometer_dial: 30,
    measuring_cup: 400,
    liter_jug: 500,
    graduated_cylinder: 60,
    beaker: 150,
    stopwatch: 25,
    number_line: 6
  });

  const handleValChange = (toolId, val) => {
    let numVal = val;
    if (typeof val === 'object' && val !== null) {
      numVal = val.ans ?? val.answer ?? val.value ?? Object.values(val)[0];
    }
    setPreviewValues((prev) => ({ ...prev, [toolId]: Number(numVal) }));
  };

  const samplePropsByTool = {
    inch_ruler: { length: previewValues.inch_ruler, showLabel: false },
    centimeter_ruler: { length: previewValues.centimeter_ruler, showLabel: false },
    measuring_tape: { length: previewValues.measuring_tape, unit: 'ft', showLabel: false },
    protractor: { angle: previewValues.protractor, showLabel: false },
    compass: { radius: previewValues.compass, showLabel: false },
    thermometer: { temperature: previewValues.thermometer, unit: 'C', min: 0, max: 60, showLabel: false },
    thermometer_dial: { temperature: previewValues.thermometer_dial, unit: 'C', min: 0, max: 60, showLabel: false },
    balance_scale: { leftWeight: 4, rightWeight: 9, leftLabel: 'L', rightLabel: 'R', showLabel: false },
    measuring_cup: { level: previewValues.measuring_cup, capacity: 1000, unit: 'ml', showLabel: false },
    liter_jug: { level: previewValues.liter_jug, capacity: 1000, unit: 'ml', showLabel: false },
    graduated_cylinder: { level: previewValues.graduated_cylinder, capacity: 100, unit: 'ml', showLabel: false },
    beaker: { level: previewValues.beaker, capacity: 250, unit: 'ml', showLabel: false },
    stopwatch: { seconds: previewValues.stopwatch, showLabel: false },
    number_line: { min: 0, max: 10, step: 2, highlight: previewValues.number_line, showLabel: false }
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #e0f7ff 0%, #ecfdf5 100%)',
      padding: 24,
      fontFamily: 'Outfit, system-ui, sans-serif',
      color: '#172033'
    }}>
      <style>{`
        .svgToolsShell {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 20px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .svgToolsNav {
          display: grid;
          gap: 8px;
        }
        .svgToolsGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .toolColumns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 820px) {
          .svgToolsShell {
            grid-template-columns: 1fr;
          }
          .svgToolsAside {
            position: static !important;
          }
          .svgToolsNav {
            display: flex;
            overflow-x: auto;
            padding-bottom: 4px;
          }
          .svgToolsNav a {
            white-space: nowrap;
            flex: 0 0 auto;
          }
          .toolColumns {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="svgToolsShell">
        <aside style={{
          position: 'sticky',
          top: 24,
          alignSelf: 'start',
          background: '#ffffff',
          border: '1px solid #dbeafe',
          borderRadius: 18,
          padding: 18,
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)'
        }} className="svgToolsAside">
          <h1 style={{ fontSize: 22, lineHeight: 1.1, margin: '0 0 4px', fontWeight: 900 }}>
            SVG Tools
          </h1>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13, fontWeight: 700 }}>
            Registry preview route
          </p>

          <nav className="svgToolsNav">
            {tools.map((tool) => (
              <a
                key={tool.id}
                href={`#${tool.id}`}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '9px 10px',
                  background: '#f8fafc',
                  fontSize: 13,
                  fontWeight: 800
                }}
              >
                {tool.id}
              </a>
            ))}
          </nav>
        </aside>

        <section style={{
          background: '#ffffff',
          border: '1px solid #dbeafe',
          borderRadius: 22,
          padding: 22,
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)'
        }}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Tool SVG Preview</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontWeight: 700 }}>
              Showing static vs. interactive draggable modes side-by-side.
            </p>
          </div>

          <div className="svgToolsGrid">
            {tools.map((toolMeta) => {
              const sampleProps = samplePropsByTool[toolMeta.id] || {};
              const publicProps = Object.fromEntries(
                Object.entries(sampleProps).filter(([key]) => key !== 'showLabel')
              );
              
              // Get the static version SVG markup directly
              const staticSvgMarkup = resolveToolSvg({
                toolSvg: toolMeta.id,
                toolProps: sampleProps
              });

              return (
                <article
                  id={toolMeta.id}
                  key={toolMeta.id}
                  style={{
                    border: '1.5px solid #bae6fd',
                    borderRadius: 16,
                    background: '#f8fafc',
                    overflow: 'hidden',
                    padding: 16
                  }}
                >
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                      {toolMeta.label.toUpperCase()}
                    </h3>
                    {previewValues[toolMeta.id] !== undefined && (
                      <span style={{ background: '#10b981', color: '#ffffff', padding: '3px 8px', borderRadius: 8, fontSize: 12, fontWeight: 900 }}>
                        Value: {previewValues[toolMeta.id]}
                      </span>
                    )}
                  </div>

                  <div className="toolColumns">
                    {/* Column 1: Static read-only version */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>STATIC DISPLAY</div>
                      <div 
                        style={{ width: '100%', display: 'flex', justifyContent: 'center' }} 
                        dangerouslySetInnerHTML={{ __html: staticSvgMarkup || '' }}
                      />
                    </div>

                    {/* Column 2: Draggable/interactive version */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', marginBottom: 8 }}>INTERACTIVE DRAGGABLE</div>
                      <InteractiveToolWrapper
                        toolId={toolMeta.id}
                        toolProps={sampleProps}
                        userAnswer={previewValues[toolMeta.id]}
                        onAnswer={(val) => handleValChange(toolMeta.id, val)}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <code style={{
                      display: 'inline-block',
                      padding: '4px 7px',
                      borderRadius: 8,
                      background: '#e0f2fe',
                      color: '#075985',
                      fontSize: 12,
                      fontWeight: 800
                    }}>
                      {`"toolSvg": "${toolMeta.id}"`}
                    </code>
                    {Object.keys(publicProps).length > 0 && (
                      <pre style={{
                        margin: '10px 0 0',
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: '#0f172a',
                        color: '#dbeafe',
                        fontSize: 10,
                        fontWeight: 700,
                        overflowX: 'auto',
                        maxHeight: 110
                      }}>
                        {JSON.stringify({ toolProps: publicProps }, null, 2)}
                      </pre>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
