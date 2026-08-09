'use client';

import React, { useState, useEffect } from 'react';

export default function PDFAnalyzerPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'rawtext'
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    fetch('/api/local-ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'ping', format: 'text' })
    })
      .then(res => res.ok ? setStatus('ready') : setStatus('error'))
      .catch(() => setStatus('error'));
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a valid PDF file (.pdf)');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) {
      setError('Please choose a PDF file to upload');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/local-ai/pdf-analyzer', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze PDF');

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!result?.summary) return;
    const s = result.summary;
    const text = `TITLE: ${s.title}\n\nEXECUTIVE SUMMARY:\n${s.executiveSummary}\n\nKEY TAKEAWAYS:\n${(s.keyPoints || []).map(p => `• ${p}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyRawText = () => {
    if (!result?.extractedText) return;
    navigator.clipboard.writeText(result.extractedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const summary = result?.summary;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid #1e293b'
        }}>
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <a href="/local-ai" style={{ color: '#94a3b8', fontWeight: '600', textDecoration: 'none', fontSize: '13px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '6px' }}>
                ⚡ Local AI & Visual Diagrams
              </a>
              <a href="/pdf-analyzer" style={{ color: '#38bdf8', fontWeight: '700', textDecoration: 'none', fontSize: '13px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '6px', border: '1px solid #38bdf8' }}>
                📄 PDF Extractor & AI Summarizer
              </a>
            </div>
            <h1 style={{
              margin: '0 0 6px 0',
              fontSize: '28px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📄 PDF Text Extractor & AI Summarizer
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
              Extract full raw text and generate comprehensive AI summaries from PDF documents using Ollama AI
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: status === 'ready' ? '#064e3b' : status === 'checking' ? '#1e293b' : '#7f1d1d',
            color: status === 'ready' ? '#6ee7b7' : status === 'checking' ? '#cbd5e1' : '#fca5a5',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: status === 'ready' ? '#10b981' : '#ef4444',
              display: 'inline-block'
            }} />
            {status === 'ready' ? 'Ollama Active (http://localhost:11434)' : status === 'checking' ? 'Checking Ollama...' : 'Ollama Offline'}
          </div>
        </div>

        {/* Upload Container */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          border: '2px dashed #818cf8',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
            Upload PDF Document to Extract & Summarize
          </h3>
          <p style={{ margin: '0 0 24px 0', color: '#94a3b8', fontSize: '14px' }}>
            Select any PDF file (Worksheet, Book, Article, Notes) to instantly extract text & generate key summary insights
          </p>

          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            id="pdf-analyzer-input"
            style={{ display: 'none' }}
          />

          <label
            htmlFor="pdf-analyzer-input"
            style={{
              backgroundColor: '#0f172a',
              color: '#818cf8',
              border: '1.5px solid #818cf8',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-block',
              marginBottom: '16px',
              transition: 'all 0.2s'
            }}
          >
            {file ? `📂 Selected: ${file.name}` : '📁 Select PDF Document'}
          </label>

          {file && (
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={handleUploadAndAnalyze}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#475569' : '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 28px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Extracting & Summarizing PDF with Local AI...
                  </>
                ) : (
                  '⚡ Extract Text & Summarize PDF'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#450a0a',
            border: '1px solid #991b1b',
            color: '#fca5a5',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Result Dashboard */}
        {result && (
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #334155',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
          }}>

            {/* Tab Controls & File Info */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #334155'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setActiveTab('summary')}
                  style={{
                    backgroundColor: activeTab === 'summary' ? '#818cf8' : '#0f172a',
                    color: activeTab === 'summary' ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  📌 AI Summary & Key Takeaways
                </button>

                <button
                  onClick={() => setActiveTab('rawtext')}
                  style={{
                    backgroundColor: activeTab === 'rawtext' ? '#818cf8' : '#0f172a',
                    color: activeTab === 'rawtext' ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  📄 Full Extracted Text ({result.characterCount} chars)
                </button>
              </div>

              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                File: <strong style={{ color: '#38bdf8' }}>{result.filename}</strong> ({result.pageCount} Pages)
              </div>
            </div>

            {/* TAB 1: SUMMARY */}
            {activeTab === 'summary' && summary && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', color: '#38bdf8', fontWeight: '800' }}>
                    {summary.title || 'PDF Document Analysis'}
                  </h2>

                  <button
                    onClick={handleCopySummary}
                    style={{
                      backgroundColor: copiedSummary ? '#059669' : '#334155',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedSummary ? '✓ Summary Copied!' : '📋 Copy Summary'}
                  </button>
                </div>

                {/* Executive Summary */}
                <div style={{
                  backgroundColor: '#0f172a',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #334155',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#818cf8', fontWeight: '700' }}>
                    📝 Executive Summary:
                  </h3>
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.7', color: '#cbd5e1' }}>
                    {summary.executiveSummary}
                  </p>
                </div>

                {/* Key Bullet Points */}
                {summary.keyPoints && summary.keyPoints.length > 0 && (
                  <div style={{
                    backgroundColor: '#0f172a',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#10b981', fontWeight: '700' }}>
                      🔑 Key Takeaways & Main Points:
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#f8fafc', fontSize: '14px', lineHeight: '1.8' }}>
                      {summary.keyPoints.map((point, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Curriculum Breakdown Cards */}
                {summary.curriculumBreakdown && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>SUBJECT & GRADE</div>
                      <div style={{ fontSize: '16px', color: '#38bdf8', fontWeight: '700', marginTop: '4px' }}>
                        {summary.curriculumBreakdown.subject} • {summary.curriculumBreakdown.estimatedGrade}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>LEARNING GOAL</div>
                      <div style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '4px', lineHeight: '1.4' }}>
                        {summary.curriculumBreakdown.learningGoal}
                      </div>
                    </div>
                  </div>
                )}

                {/* Insights / Q&A */}
                {summary.extractedQuestionsOrInsights && summary.extractedQuestionsOrInsights.length > 0 && (
                  <div style={{
                    backgroundColor: '#0f172a',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #334155'
                  }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#c084fc', fontWeight: '700' }}>
                      💡 Key Insights Derived from Document:
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '14px', lineHeight: '1.7' }}>
                      {summary.extractedQuestionsOrInsights.map((insight, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: RAW EXTRACTED TEXT */}
            {activeTab === 'rawtext' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#38bdf8' }}>
                    📄 Complete Extracted Raw Text from PDF:
                  </h3>
                  <button
                    onClick={handleCopyRawText}
                    style={{
                      backgroundColor: copiedText ? '#059669' : '#334155',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedText ? '✓ Text Copied!' : '📋 Copy Raw Text'}
                  </button>
                </div>

                <pre style={{
                  backgroundColor: '#0f172a',
                  color: '#cbd5e1',
                  padding: '20px',
                  borderRadius: '12px',
                  overflowX: 'auto',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  margin: 0,
                  border: '1px solid #334155',
                  maxHeight: '500px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6'
                }}>
                  {result.extractedText}
                </pre>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
