'use client';

import React, { useState, useEffect } from 'react';

export default function PDFSpreadsheetPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
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

  const handleUploadAndProcess = async () => {
    if (!file) {
      setError('Please choose a PDF file to upload');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setRows([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/local-ai/pdf-spreadsheet', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to process PDF');

      setData(result);
      setRows(result.rows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (rowIndex, field, value) => {
    setRows(prevRows => {
      const updated = [...prevRows];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      return updated;
    });
  };

  const generateCSVText = () => {
    if (rows.length === 0) return '';
    const headers = ['Row_ID', 'Question', 'Option_A', 'Option_B', 'Option_C', 'Option_D', 'Correct_Answer', 'Explanation'];
    const lines = rows.map((r, i) => {
      const rowId = r.Row_ID || (i + 1);
      const q = String(r.Question || '').replace(/"/g, '""');
      const optA = String(r.Option_A || '').replace(/"/g, '""');
      const optB = String(r.Option_B || '').replace(/"/g, '""');
      const optC = String(r.Option_C || '').replace(/"/g, '""');
      const optD = String(r.Option_D || '').replace(/"/g, '""');
      const ans = String(r.Correct_Answer || '').replace(/"/g, '""');
      const exp = String(r.Explanation || '').replace(/"/g, '""');
      return `"${rowId}","${q}","${optA}","${optB}","${optC}","${optD}","${ans}","${exp}"`;
    });

    return [headers.join(','), ...lines].join('\n');
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSVText();
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${file ? file.name.replace('.pdf', '') : 'worksheet'}_spreadsheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleCopyCSV = () => {
    const csvContent = generateCSVText();
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
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
              <a href="/pdf-spreadsheet" style={{ color: '#10b981', fontWeight: '700', textDecoration: 'none', fontSize: '13px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '6px', border: '1px solid #10b981' }}>
                📄 PDF to Spreadsheet (Excel) Generator
              </a>
            </div>
            <h1 style={{
              margin: '0 0 6px 0',
              fontSize: '28px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #10b981 0%, #38bdf8 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📄 PDF to Spreadsheet (Excel/CSV) AI Generator
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
              Analyze educational PDF worksheets & convert them into structured Excel Grid rows with Local Ollama AI
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
          border: '2px dashed #38bdf8',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
            Upload Educational PDF Worksheet
          </h3>
          <p style={{ margin: '0 0 24px 0', color: '#94a3b8', fontSize: '14px' }}>
            Upload any worksheet, exam paper, or textbook PDF to convert into Excel Grid rows
          </p>

          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            id="pdf-upload-input"
            style={{ display: 'none' }}
          />

          <label
            htmlFor="pdf-upload-input"
            style={{
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              border: '1.5px solid #38bdf8',
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
            {file ? `📂 Selected: ${file.name}` : '📁 Select PDF File'}
          </label>

          {file && (
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={handleUploadAndProcess}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#475569' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 28px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
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
                    Analyzing PDF with Local AI (qwen2.5:3b)...
                  </>
                ) : (
                  '⚡ Analyze PDF & Convert to Spreadsheet'
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

        {/* Table Spreadsheet Result */}
        {rows.length > 0 && (
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #334155',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
          }}>

            {/* Actions Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #334155'
            }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#10b981', fontWeight: '700' }}>
                  📊 Generated Spreadsheet Grid ({rows.length} Rows)
                </h3>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  File: {data?.filename} • Edit any cell below before downloading
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleCopyCSV}
                  style={{
                    backgroundColor: copied ? '#059669' : '#334155',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? '✓ CSV Copied!' : '📋 Copy CSV Text'}
                </button>

                <button
                  onClick={handleDownloadCSV}
                  style={{
                    backgroundColor: downloaded ? '#059669' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {downloaded ? '✓ Downloaded!' : '📥 Download Excel (.CSV)'}
                </button>
              </div>
            </div>

            {/* Spreadsheet Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a', color: '#38bdf8', borderBottom: '2px solid #334155' }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Question</th>
                    <th style={thStyle}>Option A</th>
                    <th style={thStyle}>Option B</th>
                    <th style={thStyle}>Option C</th>
                    <th style={thStyle}>Option D</th>
                    <th style={thStyle}>Correct Answer</th>
                    <th style={thStyle}>Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155', backgroundColor: idx % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                      <td style={tdStyle}>{row.Row_ID || (idx + 1)}</td>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={row.Question || ''}
                          onChange={(e) => handleCellChange(idx, 'Question', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={row.Option_A || ''}
                          onChange={(e) => handleCellChange(idx, 'Option_A', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={row.Option_B || ''}
                          onChange={(e) => handleCellChange(idx, 'Option_B', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={row.Option_C || ''}
                          onChange={(e) => handleCellChange(idx, 'Option_C', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={row.Option_D || ''}
                          onChange={(e) => handleCellChange(idx, 'Option_D', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={row.Correct_Answer || ''}
                          onChange={(e) => handleCellChange(idx, 'Correct_Answer', e.target.value)}
                          style={{ ...inputStyle, color: '#10b981', fontWeight: '700' }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={row.Explanation || ''}
                          onChange={(e) => handleCellChange(idx, 'Explanation', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

const thStyle = {
  padding: '12px 14px',
  fontWeight: '700',
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '8px 10px'
};

const inputStyle = {
  width: '100%',
  backgroundColor: 'transparent',
  color: '#f8fafc',
  border: '1px solid transparent',
  borderRadius: '6px',
  padding: '6px 8px',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s'
};
