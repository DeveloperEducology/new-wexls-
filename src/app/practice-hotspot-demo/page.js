'use client';

import React, { useState } from 'react';
import LabLayout from '../../components/practice/LabLayout';
import styles from './demo.module.css';

export default function HotspotDemoPage() {
    const [selectedObject, setSelectedObject] = useState(null);
    const [foundObjects, setFoundObjects] = useState(new Set());
    const [smartScore, setSmartScore] = useState(75);

    const handleSelect = (id, name) => {
        setSelectedObject({ id, name });
        if (id !== 'table_left' && id !== 'table_right' && id !== 'knob_left' && id !== 'knob_right') {
            const nextFound = new Set(foundObjects);
            if (!nextFound.has(id)) {
                nextFound.add(id);
                setFoundObjects(nextFound);
                setSmartScore(prev => Math.min(100, prev + 8));
            }
        }
    };

    const handleReset = () => {
        setSelectedObject(null);
        setFoundObjects(new Set());
        setSmartScore(75);
    };

    const leftPanel = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Active Topic Dropdown */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid rgba(15,23,42,0.08)' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Topic</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontWeight: '900', color: '#0f172a', fontSize: '14px' }}>📍 Hotspot Mapping Lab</span>
                    <span style={{ color: '#94a3b8', fontSize: '10px' }}>▼</span>
                </div>
            </div>

            {/* Learning Timeline */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid rgba(15,23,42,0.08)' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>Learning Path</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', border: '2px solid #22c55e' }}>✓</div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>Introduction to Coordinates</div>
                            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700' }}>Completed</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#eef2ff', color: '#6366f1', border: '2.5px solid #4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>•</div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#4f46e5' }}>Active Interactive Canvas</div>
                            <div style={{ fontSize: '9px', color: '#6366f1', fontWeight: '700' }}>In Progress</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>🔒</div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>Mastery Assessment</div>
                            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700' }}>Locked</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Goal Card */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid rgba(15,23,42,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>🎯 Daily Goal</span>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '800' }}>20 / 30 min</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '66%', height: '100%', background: '#22c55e' }} />
                </div>
            </div>
        </div>
    );

    const rightPanel = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Mastery Circular Score */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid rgba(15,23,42,0.08)' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>Mastery Score</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '60px', height: '60px', position: 'relative' }}>
                        <svg width="60" height="60" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4f46e5" strokeDasharray={`${smartScore}, 100`} strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: '950', color: '#0f172a' }}>{smartScore}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                            {smartScore >= 100 ? '🏅 Mastered!' : smartScore >= 90 ? '💎 Proficient' : '🌱 Building'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
                            {foundObjects.size === 3 ? 'Excellent job! All items found!' : `${3 - foundObjects.size} items remaining to find.`}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Performance Log */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid rgba(15,23,42,0.08)' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>Recent Performance</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#ecfdf5', borderRadius: '8px', fontSize: '11px', fontWeight: '750', color: '#065f46' }}>
                        <span>Correct Hits</span>
                        <span>{foundObjects.size}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#fef2f2', borderRadius: '8px', fontSize: '11px', fontWeight: '750', color: '#991b1b' }}>
                        <span>Incorrect Hits</span>
                        <span>0</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#eff6ff', borderRadius: '8px', fontSize: '11px', fontWeight: '750', color: '#1e40af' }}>
                        <span>Accuracy</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <LabLayout
            title="Interactive Hotspot Playground"
            grade="Grade 2 Mathematics"
            smartScore={smartScore}
            onReset={handleReset}
            leftPanel={leftPanel}
            rightPanel={rightPanel}
            subject="math"
        >
            <style dangerouslySetInnerHTML={{ __html: `
                .st0 { fill: #dcedc8 !important; }
                .st1 { fill: #c5e1a5 !important; }
                .st2 { fill: none; stroke: #8bc34a; stroke-width: 2; }
                .st3 { fill: #e6e9ed !important; }
                .st4 { fill: #ccd1d9 !important; }
                .st5 { fill: #aab2bd !important; }
                .st6 { stroke: #8bc34a; stroke-width: 1.5; stroke-dasharray: 3,3; fill: none; }
                .st7 { stroke: #7cb342; stroke-width: 1.5; stroke-dasharray: 3,3; fill: none; }
                .st8 { stroke: #aab2bd; stroke-width: 1.5; }
                .st9 { stroke: #8bc34a; stroke-width: 1.5; }
                .st10 { stroke: #ccd1d9; stroke-width: 1.5; }
            `}} />

            <div className={styles.dashboardCard}>
                <h3 className={styles.title}>Visual Hotspot Coordination Demo</h3>
                <p className={styles.description}>
                    Explore vector shape mapping inside Next.js. Click on any interactive object (Watermelon, Ice Cream Tub, Secret Scroll, or Table Knobs) to trace coordinates and trigger visual glow states.
                </p>
                
                <div className={styles.canvasWrapper}>
                    {/* Background Bedroom Wallpaper */}
                    <img 
                        src="https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780337176148-room_bg_image.webp" 
                        alt="Bedroom Scene" 
                        className={styles.bgImage}
                    />

                    {/* SVG Interactive Overlays */}
                    <svg viewBox="0 0 800 465" className={styles.svgOverlay}>
                        {/* 1. Left Side Table (Pasted SVG structure mirrored using dy=-50 translation) */}
                        <g 
                            id="table_left_group"
                            className={`${styles.interactiveElement} ${selectedObject?.id === 'table_left' ? styles.selectedElement : ''}`}
                            transform="translate(400, -50)"
                            onClick={() => handleSelect('table_left', 'Table Surface (Left Half) 🪵')}
                        >
                            <polygon className="st3" points="-172.3,363.3 -172.3,491.2 -172.2,491.3 -168.4,483.6 -168.4,363.3" />
                            <polygon className="st4" points="-184.7,363.3 -184.7,491.3 -172.3,491.3 -172.3,491.2 -172.3,363.3" />
                            <polygon className="st3" points="-8.2,303.3 -8.2,279.6 -193.9,279.6 -247.5,303.3" />
                            <polygon className="st3" points="-202.2,515.4 -197.3,508.8 -197.3,363.3 -202.2,363.3" />
                            <path className="st5" d="M-172.3,363.3h3.9H-8.2v-10h-48.4v-29.5h48.4v-7.1h-193.9v46.6h4.9h12.6H-172.3z M-201.5,353.3v-29.5h135.9v29.5H-201.5z" />
                            <polygon className="st5" points="-202.2,316.7 -215.6,316.7 -215.6,515.4 -202.2,515.4 -202.2,363.3" />
                            <polygon className="st4" points="-202.2,316.7 -8.2,316.7 -8.2,303.3 -247.5,303.3 -247.5,316.7 -215.6,316.7" />
                            <path className="st4" d="M-65.6,353.3v-29.5h-135.9v29.5H-65.6z M-194.6,346v-15.6h122V346H-194.6z" />
                            <polygon className="st4" points="-56.7,353.3 -8.2,353.3 -8.2,346 -49,346 -49,330.4 -8.2,330.4 -8.2,323.8 -56.7,323.8" />
                            
                            {/* Table Runner */}
                            <g id="runner_left">
                                <polygon className="st0" points="-6.9,279.6 -7.8,279.6 -126.7,279.6 -137.4,303.2 -7.8,391.8 -7.8,391.8 10.8,391.8 10.8,279.6" />
                                <polygon className="st1" points="10.8,279.6 -126.6,279.6 -137.3,303.2 10.8,303.2" />
                                <line className="st6" x1="10.8" y1="373.9" x2="9.5" y2="373.9" />
                                <polyline className="st7" points="7,373.9 -13.1,373.9 -109.1,304.6" />
                                <polyline className="st6" points="-110.1,303.8 -111.1,303.1 -110.9,301.9" />
                                <line className="st8" x1="-110.4" y1="299.6" x2="-106.5" y2="282.1" />
                                <line className="st6" x1="-106.3" y1="280.9" x2="-106" y2="279.7" />
                                
                                <line className="st6" x1="10.4" y1="359.1" x2="9.1" y2="359.1" />
                                <polyline className="st9" points="6.7,359.1 -9.8,359.1 -87.9,304.5" />
                                <polyline className="st6" points="-88.9,303.8 -90,303.1 -89.7,301.9" />
                                <line className="st10" x1="-89.3" y1="299.5" x2="-86.2" y2="282.1" />
                                <line className="st6" x1="-86" y1="280.9" x2="-85.8" y2="279.7" />
                            </g>
                        </g>

                        {/* 2. Right Side Table (Mirrored using scale(-1, 1) translate) */}
                        <g 
                            id="table_right_group"
                            className={`${styles.interactiveElement} ${selectedObject?.id === 'table_right' ? styles.selectedElement : ''}`}
                            transform="translate(400, -50) scale(-1, 1)"
                            onClick={() => handleSelect('table_right', 'Table Surface (Right Half) 🪵')}
                        >
                            <polygon className="st3" points="-172.3,363.3 -172.3,491.2 -172.2,491.3 -168.4,483.6 -168.4,363.3" />
                            <polygon className="st4" points="-184.7,363.3 -184.7,491.3 -172.3,491.3 -172.3,491.2 -172.3,363.3" />
                            <polygon className="st3" points="-8.2,303.3 -8.2,279.6 -193.9,279.6 -247.5,303.3" />
                            <polygon className="st3" points="-202.2,515.4 -197.3,508.8 -197.3,363.3 -202.2,363.3" />
                            <path className="st5" d="M-172.3,363.3h3.9H-8.2v-10h-48.4v-29.5h48.4v-7.1h-193.9v46.6h4.9h12.6H-172.3z M-201.5,353.3v-29.5h135.9v29.5H-201.5z" />
                            <polygon className="st5" points="-202.2,316.7 -215.6,316.7 -215.6,515.4 -202.2,515.4 -202.2,363.3" />
                            <polygon className="st4" points="-202.2,316.7 -8.2,316.7 -8.2,303.3 -247.5,303.3 -247.5,316.7 -215.6,316.7" />
                            <path className="st4" d="M-65.6,353.3v-29.5h-135.9v29.5H-65.6z M-194.6,346v-15.6h122V346H-194.6z" />
                            <polygon className="st4" points="-56.7,353.3 -8.2,353.3 -8.2,346 -49,346 -49,330.4 -8.2,330.4 -8.2,323.8 -56.7,323.8" />
                            
                            {/* Table Runner */}
                            <g id="runner_right">
                                <polygon className="st0" points="-6.9,279.6 -7.8,279.6 -126.7,279.6 -137.4,303.2 -7.8,391.8 -7.8,391.8 10.8,391.8 10.8,279.6" />
                                <polygon className="st1" points="10.8,279.6 -126.6,279.6 -137.3,303.2 10.8,303.2" />
                                <line className="st6" x1="10.8" y1="373.9" x2="9.5" y2="373.9" />
                                <polyline className="st7" points="7,373.9 -13.1,373.9 -109.1,304.6" />
                                <polyline className="st6" points="-110.1,303.8 -111.1,303.1 -110.9,301.9" />
                                <line className="st8" x1="-110.4" y1="299.6" x2="-106.5" y2="282.1" />
                                <line className="st6" x1="-106.3" y1="280.9" x2="-106" y2="279.7" />
                                
                                <line className="st6" x1="10.4" y1="359.1" x2="9.1" y2="359.1" />
                                <polyline className="st9" points="6.7,359.1 -9.8,359.1 -87.9,304.5" />
                                <polyline className="st6" points="-88.9,303.8 -90,303.1 -89.7,301.9" />
                                <line className="st10" x1="-89.3" y1="299.5" x2="-86.2" y2="282.1" />
                                <line className="st6" x1="-86" y1="280.9" x2="-85.8" y2="279.7" />
                            </g>
                        </g>

                        {/* 3. Table Drawer Knobs (Interactive circles) */}
                        <circle 
                            className={`${styles.interactiveElement} ${selectedObject?.id === 'knob_left' ? styles.selectedElement : ''}`}
                            cx="266.4" 
                            cy="296" 
                            r="6" 
                            fill="#656d78" 
                            stroke="#434a54"
                            strokeWidth="1.5"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect('knob_left', 'Left Drawer Handle ⚙️');
                            }}
                        />

                        <circle 
                            className={`${styles.interactiveElement} ${selectedObject?.id === 'knob_right' ? styles.selectedElement : ''}`}
                            cx="533.6" 
                            cy="296" 
                            r="6" 
                            fill="#656d78" 
                            stroke="#434a54"
                            strokeWidth="1.5"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect('knob_right', 'Right Drawer Handle ⚙️');
                            }}
                        />

                        {/* 4. Watermelon */}
                        <g 
                            className={`${styles.interactiveElement} ${selectedObject?.id === 'watermelon' ? styles.selectedElement : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect('watermelon', 'Juicy Watermelon 🍉');
                            }}
                        >
                            <circle cx="610" cy="180" r="42" fill="#22c55e" stroke="#16a34a" strokeWidth="2.5" />
                            <path d="M580,158 Q610,180 580,202" fill="none" stroke="#14532d" strokeWidth="3" />
                            <path d="M600,146 Q620,180 600,214" fill="none" stroke="#14532d" strokeWidth="3.5" />
                            <path d="M620,146 Q630,180 620,214" fill="none" stroke="#14532d" strokeWidth="3" />
                            <path d="M635,158 Q645,180 635,202" fill="none" stroke="#14532d" strokeWidth="2" />
                        </g>

                        {/* 5. Mint Chip Ice Cream Cup */}
                        <g 
                            className={`${styles.interactiveElement} ${selectedObject?.id === 'ice_cream' ? styles.selectedElement : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect('ice_cream', 'Mint Chip Ice Cream 🍦');
                            }}
                        >
                            {/* Cup base */}
                            <path d="M465,150 L470,210 L510,210 L515,150 Z" fill="#047857" stroke="#064e3b" strokeWidth="2.5" />
                            {/* Lid */}
                            <ellipse cx="490" cy="150" rx="26" ry="6" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                            {/* Label */}
                            <rect x="475" y="165" width="30" height="25" rx="3" fill="#fef08a" />
                            <text x="490" y="180" fontSize="7" fontWeight="900" textAnchor="middle" fill="#78350f">MINT</text>
                        </g>

                        {/* 6. Secret Scroll */}
                        <g 
                            className={`${styles.interactiveElement} ${selectedObject?.id === 'scroll' ? styles.selectedElement : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect('scroll', 'Secret Scroll 📜');
                            }}
                        >
                            {/* Scroll cylinder */}
                            <rect x="290" y="380" width="85" height="22" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                            <ellipse cx="290" cy="391" rx="4" ry="11" fill="#cbd5e1" />
                            <ellipse cx="375" cy="391" rx="4" ry="11" fill="#cbd5e1" />
                            {/* Red ribbon band */}
                            <rect x="330" y="380" width="10" height="22" fill="#ef4444" />
                            {/* Gold star ribbon seal */}
                            <circle cx="335" cy="391" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                            <text x="335" y="394" fontSize="7" fontWeight="950" textAnchor="middle" fill="#78350f">S</text>
                        </g>
                    </svg>
                </div>

                {/* Feedback Speech Bubble */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                    {selectedObject ? (
                        <div className={styles.feedbackBubble}>
                            <span>🔍 Found: <strong>{selectedObject.name}</strong></span>
                            <span style={{ fontSize: '11px', color: '#38bdf8', opacity: 0.9 }}>
                                (ID: {selectedObject.id})
                            </span>
                        </div>
                    ) : (
                        <div className={styles.feedbackBubble} style={{ background: '#3b82f6' }}>
                            <span>💡 Tap on any object inside the bedroom to test mapping logic!</span>
                        </div>
                    )}

                    <button 
                        type="button" 
                        onClick={handleReset} 
                        className={styles.resetBtn}
                    >
                        🔄 Reset Demo
                    </button>
                </div>
            </div>
        </LabLayout>
    );
}
