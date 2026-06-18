'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Pre-coded templates from the approved curriculum
const DIVISION_TEMPLATES = [
  {
    title: "Video 1: The Magic Cookie Jar",
    script: "Hi friend! I have 4 delicious cookies and 2 hungry friends. To be fair, let’s share! One for you, one for me... one for you, one for me! That is division!",
    prompt: "A magical glowing cookie jar on a picnic blanket, 4 chocolate chip cookies float out and divide evenly into 2 colorful bowls, bright cartoon claymation."
  },
  {
    title: "Video 2: Two Hands, Four Fingers",
    script: "Look at your hands! We have 4 fingers up. Let’s divide them into two groups. Two fingers here, two fingers there. See? 4 divided by 2 is 2!",
    prompt: "Close up of two cute cartoon hands showing 4 fingers up, dividing them into two groups of 2 fingers, simple educational animation."
  },
  {
    title: "Video 3: The Toy Car Garage",
    script: "I have 6 cool toy cars and 3 garages. Let’s park them! If we put 2 cars in each garage, everyone has a home. Division is just sharing!",
    prompt: "Three cute colorful toy garages in a row. Six shiny little toy cars drive and park themselves, two cars in each garage. Playful claymation style."
  },
  {
    title: "Video 4: Berry Picking",
    script: "I found 8 yummy berries! If I share them between you and me, how many do we get? Let’s count... one, two, three, four each! Division is magic sharing.",
    prompt: "A cute wooden basket filled with 8 bright red berries. The berries float out and split into 2 equal piles of 4 berries on white plates."
  },
  {
    title: "Video 5: Sock Sorting",
    script: "Oh no, a pile of 10 socks! Let's divide them into 2 laundry baskets. Five in this one, five in that one. No sock is left behind!",
    prompt: "Ten colorful patterned socks float and organize themselves into two laundry baskets, 5 socks in each basket, neat and satisfying animation."
  },
  {
    title: "Video 6: Sharing Stickers",
    script: "I have 12 shiny star stickers. Let’s give them to our 3 favorite teddy bears. 4 stars for Teddy, 4 for Bunny, and 4 for Puppy. Yay for equal shares!",
    prompt: "Three cute cartoon teddy bears sitting side by side. Twelve shiny yellow stars fly and attach themselves to the bears, 4 on each bear's belly."
  },
  {
    title: "Video 7: The Apple Slice",
    script: "I have one big apple, but we want 2 pieces! We slice it right in half. That’s dividing one whole thing into two equal parts. Nom nom!",
    prompt: "A shiny red apple sits on a cutting board. A wooden toy knife gently slices it into two equal halves, clean pastel background."
  },
  {
    title: "Video 8: Building Blocks",
    script: "Let’s build! 15 blocks divided into 3 towers. Let’s stack them up. 1, 2, 3, 4, 5... each tower is the same size. Perfect division!",
    prompt: "Colorful toy wooden building blocks stacking themselves up to build three identical towers of 5 blocks each, bright and modern aesthetic."
  },
  {
    title: "Video 9: High-Five Party",
    script: "We have 10 friends here. Let’s divide into 2 teams for a high-five race! 5 friends on this side, 5 on that side. Ready, set, go!",
    prompt: "Ten cute diverse cartoon characters lining up and dividing into 2 groups of 5 on opposite sides of a playing field, high fiving, joyful animation."
  },
  {
    title: "Video 10: The Master Sharer",
    script: "We did it! You’ve learned that division is just sharing things equally so everyone is happy. You are officially a Master Sharer!",
    prompt: "A golden master sharer badge or crown sparkles, surrounded by cute animated smiling stars and balloons floating, celebratory claymation style."
  }
];

export default function ConceptVideoGeneratorPage() {
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' | 'extractor'

  const [script, setScript] = useState('');
  const [prompt, setPrompt] = useState('');
  const [voice, setVoice] = useState('gemini:Puck');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  
  // Script assistant
  const [aiTopic, setAiTopic] = useState('');
  const [aiScriptLoading, setAiScriptLoading] = useState(false);

  // Generator states
  const [status, setStatus] = useState('idle'); // 'idle' | 'generating' | 'completed' | 'error'
  const [operationId, setOperationId] = useState('');
  const [progressLog, setProgressLog] = useState([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // YouTube-to-GIF Extractor states
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [gifStartTime, setGifStartTime] = useState('00:00:00');
  const [gifDuration, setGifDuration] = useState(3);
  const [gifName, setGifName] = useState('');
  const [gifStatus, setGifStatus] = useState('idle'); // 'idle' | 'extracting' | 'completed' | 'error'
  const [gifProgressLog, setGifProgressLog] = useState([]);
  const [extractedGifUrl, setExtractedGifUrl] = useState('');
  const [extractedGifData, setExtractedGifData] = useState(null);
  const [gifErrorMsg, setGifErrorMsg] = useState('');
  const [recentStickers, setRecentStickers] = useState([]);
  const [loadingStickers, setLoadingStickers] = useState(false);

  // Asset Library
  const [libraryVideos, setLibraryVideos] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  const pollIntervalRef = useRef(null);

  // Load previously generated videos
  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/admin/video/generate');
      const data = await res.json();
      if (data.success) {
        setLibraryVideos(data.videos || []);
      }
    } catch (err) {
      console.error('Failed to load video library:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  // Load recently extracted stickers
  const fetchRecentStickers = async () => {
    setLoadingStickers(true);
    try {
      const res = await fetch('/api/admin/list-images?prefix=images/stickers');
      const data = await res.json();
      if (data.images) {
        setRecentStickers(data.images);
      }
    } catch (err) {
      console.error('Failed to load recent stickers:', err);
    } finally {
      setLoadingStickers(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
    fetchRecentStickers();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const addLog = (message) => {
    setProgressLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const addGifLog = (message) => {
    setGifProgressLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleExtractGif = async () => {
    if (!youtubeUrl.trim()) {
      alert('Please enter a YouTube video URL.');
      return;
    }

    setGifStatus('extracting');
    setExtractedGifUrl('');
    setExtractedGifData(null);
    setGifErrorMsg('');
    setGifProgressLog([]);
    addGifLog('Initializing YouTube extraction job...');

    try {
      addGifLog('Step 1: Contacting server to fetch metadata and start download...');
      const res = await fetch('/api/admin/video/youtube-to-gif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl,
          startTime: gifStartTime,
          duration: gifDuration,
          name: gifName
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to extract GIF sticker.');

      addGifLog(`Success! GIF generated and uploaded to Cloudflare R2.`);
      addGifLog(`File size: ${(data.sizeBytes / 1024).toFixed(1)} KB`);
      addGifLog(`Dimensions: ${data.dimensions.width}x${data.dimensions.height} (Aspect Ratio: ${data.dimensions.aspectRatio})`);
      addGifLog(`Asset Key: ${data.key}`);

      setExtractedGifUrl(data.url);
      setExtractedGifData(data);
      setGifStatus('completed');
      fetchRecentStickers(); // Refresh gallery
    } catch (err) {
      setGifErrorMsg(err.message);
      setGifStatus('error');
      addGifLog(`Error: ${err.message}`);
    }
  };

  // Populate from template
  const handleSelectTemplate = (tpl) => {
    setScript(tpl.script);
    setPrompt(tpl.prompt);
  };

  // Generate Script using AI Helper
  const handleGenerateScript = async () => {
    if (!aiTopic.trim()) return;
    setAiScriptLoading(true);
    try {
      const res = await fetch('/api/admin/video/write-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic }),
      });
      const data = await res.json();
      if (data.success) {
        setScript(data.script);
        setPrompt(`Cute 3D claymation illustrating ${aiTopic}, simple educational styling.`);
      } else {
        alert(data.error || 'Failed to write script.');
      }
    } catch (err) {
      alert('Network error writing script.');
    } finally {
      setAiScriptLoading(false);
    }
  };

  // Generate Video Pipeline
  const handleGenerateVideo = async () => {
    if (!script.trim()) {
      alert('Please enter a narration script.');
      return;
    }

    setStatus('generating');
    setFinalVideoUrl('');
    setErrorMsg('');
    setOperationId('');
    setProgressLog([]);
    addLog("Initiating concept explanation video job...");

    try {
      addLog("Step 1: Refining visual prompt and generating voiceover audio via Gemini TTS...");
      const res = await fetch('/api/admin/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, prompt, voice, aspectRatio }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to start video job.');

      setOperationId(data.operationId);
      addLog(`Gemini TTS Voice generated! Audio cached temporarily.`);
      addLog(`Visual prompt engineered: "${data.visualPrompt.slice(0, 80)}..."`);
      addLog(`Vertex AI Veo video operation started. ID: ${data.operationId}`);
      addLog("Step 2: Rendering animation frames (GCP operation running in background)...");

      // Set up status checking poll loop
      pollIntervalRef.current = setInterval(async () => {
        try {
          addLog("Checking operation status on Google Cloud Vertex AI...");
          const statusRes = await fetch(`/api/admin/video/status?operationId=${encodeURIComponent(data.operationId)}`);
          const statusData = await statusRes.json();

          if (!statusRes.ok) {
            throw new Error(statusData.error || 'Failed status check.');
          }

          if (statusData.status === 'processing') {
            addLog("Veo is still generating animation frames. Waiting...");
          } else if (statusData.status === 'completed') {
            clearInterval(pollIntervalRef.current);
            addLog("Step 3: Animation complete! Downloading assets to local server...");
            addLog("Step 4: Merging video and audio tracks via local FFmpeg binary...");
            addLog("Step 5: Uploading combined MP4 to Cloudflare R2 bucket...");
            addLog("Success! Video generated, synchronized, and saved.");
            setFinalVideoUrl(statusData.url);
            setStatus('completed');
            fetchLibrary(); // refresh library list
          } else if (statusData.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            throw new Error(statusData.error || 'Vertex AI video rendering failed.');
          }
        } catch (pollErr) {
          clearInterval(pollIntervalRef.current);
          setErrorMsg(pollErr.message);
          setStatus('error');
          addLog(`Error: ${pollErr.message}`);
        }
      }, 15000); // check status every 15s

    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
      addLog(`Error initiating job: ${err.message}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Outfit, Inter, sans-serif',
      padding: '24px 30px',
    }}>
      {/* Top Navbar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #1e293b',
        paddingBottom: 16,
        marginBottom: 24
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            📹 Concept Explanation Video Creator
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            Author preschool narration videos using Gemini TTS voices and Vertex AI Veo animation.
          </p>
        </div>
        <Link href="/admin" style={{
          padding: '8px 16px',
          borderRadius: 8,
          background: '#1e293b',
          color: '#cbd5e1',
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
          border: '1px solid #334155',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.target.style.background = '#334155'; e.target.style.color = '#fff'; }}
        onMouseLeave={e => { e.target.style.background = '#1e293b'; e.target.style.color = '#cbd5e1'; }}
        >
          ← Return to Admin Panel
        </Link>
      </header>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        borderBottom: '1px solid #1e293b',
        paddingBottom: 12
      }}>
        <button
          onClick={() => setActiveTab('generator')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: activeTab === 'generator' ? 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)' : '#1e293b',
            color: activeTab === 'generator' ? '#fff' : '#cbd5e1',
            border: activeTab === 'generator' ? 'none' : '1px solid #334155',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'generator' ? '0 4px 12px rgba(56, 189, 248, 0.25)' : 'none'
          }}
        >
          🎬 Concept Video Generator
        </button>
        <button
          onClick={() => setActiveTab('extractor')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: activeTab === 'extractor' ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' : '#1e293b',
            color: activeTab === 'extractor' ? '#fff' : '#cbd5e1',
            border: activeTab === 'extractor' ? 'none' : '1px solid #334155',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'extractor' ? '0 4px 12px rgba(168, 85, 247, 0.25)' : 'none'
          }}
        >
          🖼️ YouTube to GIF Sticker Extractor
        </button>
      </div>

      {activeTab === 'generator' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 24,
        }}>
        
        {/* Left Panel: Creator Control Panel */}
        <div style={{
          background: '#1e293b',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#38bdf8' }}>1. Script & Parameters</h2>

          {/* Quick Templates Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
              QUICK DIVISION TEMPLATES
            </label>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: 160,
              overflowY: 'auto',
              border: '1px solid #334155',
              padding: 6,
              borderRadius: 8,
              background: '#0f172a'
            }}>
              {DIVISION_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  style={{
                    textAlign: 'left',
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    fontSize: 11,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* AI Script Helper */}
          <div style={{
            background: '#161e2e',
            borderRadius: 8,
            padding: 10,
            border: '1px solid #111827'
          }}>
            <label style={{ display: 'block', fontSize: 11, color: '#a855f7', fontWeight: 700, marginBottom: 4 }}>
              🪄 WRITE SCRIPT WITH GEMINI
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="Topic, e.g., 'socks' or 'birds'"
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                style={{
                  flex: 1,
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: '6px 10px',
                  color: '#fff',
                  fontSize: 12
                }}
              />
              <button
                type="button"
                onClick={handleGenerateScript}
                disabled={aiScriptLoading}
                style={{
                  background: '#a855f7',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {aiScriptLoading ? 'Writing...' : 'Write'}
              </button>
            </div>
          </div>

          {/* Narration Script Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
              NARRATION SCRIPT (SPOKEN VOICE)
            </label>
            <textarea
              rows={4}
              value={script}
              onChange={e => setScript(e.target.value)}
              placeholder="Hi friend! I have 4 delicious cookies and 2 hungry friends..."
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: 10,
                color: '#fff',
                fontSize: 13,
                resize: 'none',
                lineHeight: 1.4
              }}
            />
          </div>

          {/* Visual Prompt Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
              VISUAL STYLE / SCENE DESCRIPTION
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="3D claymation scene of 4 chocolate chip cookies flying..."
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: 10,
                color: '#fff',
                fontSize: 12,
                resize: 'none',
                lineHeight: 1.4
              }}
            />
          </div>

          {/* Voices and Aspect ratio row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>
                🎙️ TTS VOICE
              </label>
              <select
                value={voice}
                onChange={e => setVoice(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: 8,
                  color: '#fff',
                  fontSize: 12
                }}
              >
                <option value="gemini:Puck">Puck (Friendly Boy)</option>
                <option value="gemini:Kore">Kore (Warm Female)</option>
                <option value="gemini:Charon">Charon (Calm Male)</option>
                <option value="gemini:Fenrir">Fenrir (Deep Male)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>
                📐 RATIO
              </label>
              <select
                value={aspectRatio}
                onChange={e => setAspectRatio(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: 8,
                  color: '#fff',
                  fontSize: 12
                }}
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Vertical)</option>
              </select>
            </div>
          </div>

          {/* Trigger Generate Button */}
          <button
            type="button"
            onClick={handleGenerateVideo}
            disabled={status === 'generating'}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: status === 'generating' ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.2s',
              marginTop: 8
            }}
            onMouseEnter={e => { if (status !== 'generating') e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { if (status !== 'generating') e.currentTarget.style.opacity = '1'; }}
          >
            {status === 'generating' ? '⚡ RENDERING VIDEO...' : '🎬 GENERATE CONCEPT VIDEO'}
          </button>
        </div>

        {/* Center Panel: Active Generation Status & Video Preview */}
        <div style={{
          background: '#1e293b',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#818cf8' }}>2. Output & Preview</h2>

          {/* Active Generation Screen */}
          {status === 'generating' && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: 12,
              padding: 16,
              border: '1px solid #334155'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24, animation: 'spin 2s linear infinite' }}>⏳</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>AI Rendering in Progress</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>Please do not close this tab. This will take 1-2 minutes.</p>
                </div>
              </div>

              {/* Progress steps log */}
              <div style={{
                flex: 1,
                background: '#090d16',
                borderRadius: 8,
                padding: 10,
                fontFamily: 'Courier New, monospace',
                fontSize: 10,
                color: '#4ade80',
                overflowY: 'auto',
                maxHeight: 250
              }}>
                {progressLog.map((log, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* Ready & Completed Video Player */}
          {status === 'completed' && finalVideoUrl && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{
                background: '#0f172a',
                borderRadius: 12,
                overflow: 'hidden',
                border: '2px solid #22c55e',
                boxShadow: '0 10px 30px rgba(34, 197, 94, 0.15)',
                aspectRatio: aspectRatio === '16:9' ? '16/9' : '9/16',
                maxHeight: 320,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}>
                <video
                  src={finalVideoUrl}
                  controls
                  autoPlay
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(finalVideoUrl);
                    alert('CDN Video URL copied to clipboard!');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#22c55e',
                    color: '#fff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🔗 Copy R2 CDN Link
                </button>
                <a
                  href={finalVideoUrl}
                  download="concept-explanation.mp4"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#334155',
                    color: '#fff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                    textDecoration: 'none'
                  }}
                >
                  📥 Download MP4
                </a>
              </div>
            </div>
          )}

          {/* Idle screen */}
          {status === 'idle' && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: 12,
              padding: 24,
              border: '1px dashed #334155',
              color: '#64748b',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: 32, marginBottom: 8 }}>🎬</span>
              <p style={{ margin: 0, fontSize: 13 }}>Enter script details on the left and click generate to view your video animation preview.</p>
            </div>
          )}

          {/* Error screen */}
          {status === 'error' && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 12,
              padding: 16,
              border: '1px solid #ef4444',
              color: '#fca5a5'
            }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#ef4444' }}>Generation Failed</h3>
              <p style={{ margin: '4px 0', fontSize: 12, lineHeight: 1.4 }}>{errorMsg}</p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                style={{
                  background: '#334155',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 12,
                  alignSelf: 'flex-start'
                }}
              >
                Reset Generator
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Asset Library */}
        <div style={{
          background: '#1e293b',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#a855f7' }}>3. Library & Archives</h2>
          
          {loadingLibrary ? (
            <div style={{ color: '#64748b', fontSize: 12 }}>Loading library...</div>
          ) : libraryVideos.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: 12 }}>No previously generated concept videos.</div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxHeight: '75vh',
              overflowY: 'auto'
            }}>
              {libraryVideos.map((video) => (
                <div
                  key={video._id}
                  style={{
                    background: '#0f172a',
                    borderRadius: 10,
                    padding: 10,
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#a855f7', fontWeight: 700 }}>
                      {video.voice.replace('gemini:', '')} • {video.aspectRatio}
                    </span>
                    <span style={{ fontSize: 9, color: '#64748b' }}>
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p style={{
                    margin: 0,
                    fontSize: 11,
                    lineHeight: 1.3,
                    color: '#e2e8f0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {video.script}
                  </p>

                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setFinalVideoUrl(video.finalVideoR2Url);
                        setAspectRatio(video.aspectRatio || '16:9');
                        setStatus('completed');
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        background: '#334155',
                        color: '#e2e8f0',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      👁️ Load
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(video.finalVideoR2Url);
                        alert('CDN Video URL copied!');
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#1e293b',
                        color: '#cbd5e1',
                        border: '1px solid #334155',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🔗 Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'extractor' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 24,
        }}>
          {/* Left Panel: Extractor Control Panel */}
          <div style={{
            background: '#1e293b',
            borderRadius: 16,
            padding: 20,
            border: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ec4899' }}>1. YouTube Input</h2>

            {/* YouTube URL input */}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
                YOUTUBE VIDEO URL
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: 10,
                  color: '#fff',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Start time */}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
                START TIME (HH:MM:SS or Seconds)
              </label>
              <input
                type="text"
                value={gifStartTime}
                onChange={e => setGifStartTime(e.target.value)}
                placeholder="e.g. 00:00:43 or 43"
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: 10,
                  color: '#fff',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Duration slider */}
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
                <span>DURATION (SECONDS)</span>
                <span style={{ color: '#ec4899' }}>{gifDuration}s</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={gifDuration}
                onChange={e => setGifDuration(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#ec4899',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: 10, color: '#64748b' }}>Capped at 10 seconds to keep sizes low and loops clean.</span>
            </div>

            {/* Sticker name override */}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
                STICKER NAME (OPTIONAL)
              </label>
              <input
                type="text"
                value={gifName}
                onChange={e => setGifName(e.target.value)}
                placeholder="Defaults to video title"
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: 10,
                  color: '#fff',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Button */}
            <button
              type="button"
              onClick={handleExtractGif}
              disabled={gifStatus === 'extracting'}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                cursor: gifStatus === 'extracting' ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                transition: 'all 0.2s',
                marginTop: 8
              }}
              onMouseEnter={e => { if (gifStatus !== 'extracting') e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { if (gifStatus !== 'extracting') e.currentTarget.style.opacity = '1'; }}
            >
              {gifStatus === 'extracting' ? '⚡ EXTRACTING STICKER...' : '🖼️ EXTRACT LOOPING GIF'}
            </button>
          </div>

          {/* Center Panel: Output & Preview */}
          <div style={{
            background: '#1e293b',
            borderRadius: 16,
            padding: 20,
            border: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ec4899' }}>2. Output & Preview</h2>

            {/* Active Extraction screen */}
            {gifStatus === 'extracting' && (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24, animation: 'spin 2s linear infinite' }}>⏳</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Extracting Clip</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>Running yt-dlp and ffmpeg... This will take ~10 seconds.</p>
                  </div>
                </div>

                {/* Term log */}
                <div style={{
                  flex: 1,
                  background: '#090d16',
                  borderRadius: 8,
                  padding: 10,
                  fontFamily: 'Courier New, monospace',
                  fontSize: 10,
                  color: '#e879f9',
                  overflowY: 'auto',
                  maxHeight: 250
                }}>
                  {gifProgressLog.map((log, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>{log}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Preview */}
            {gifStatus === 'completed' && extractedGifUrl && (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{
                  background: '#0f172a',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '2px solid #ec4899',
                  boxShadow: '0 10px 30px rgba(236, 72, 153, 0.15)',
                  minHeight: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  padding: 12
                }}>
                  <img
                    src={extractedGifUrl}
                    alt="Extracted Sticker"
                    style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain' }}
                  />
                </div>

                {/* Details list */}
                {extractedGifData && (
                  <div style={{
                    background: '#0f172a',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 11,
                    color: '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}>
                    <div><strong style={{ color: '#cbd5e1' }}>Name:</strong> {extractedGifData.name}</div>
                    <div><strong style={{ color: '#cbd5e1' }}>Dimensions:</strong> {extractedGifData.dimensions.width}x{extractedGifData.dimensions.height}</div>
                    <div><strong style={{ color: '#cbd5e1' }}>Size:</strong> {(extractedGifData.sizeBytes / 1024).toFixed(1)} KB</div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(extractedGifUrl);
                      alert('CDN Sticker GIF URL copied to clipboard!');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#ec4899',
                      color: '#fff',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🔗 Copy CDN Link
                  </button>
                  <a
                    href={extractedGifUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#334155',
                      color: '#fff',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: 'center',
                      textDecoration: 'none'
                    }}
                  >
                    👁️ Open GIF
                  </a>
                </div>
              </div>
            )}

            {/* Idle screen */}
            {gifStatus === 'idle' && (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: 12,
                padding: 24,
                border: '1px dashed #334155',
                color: '#64748b',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: 32, marginBottom: 8 }}>🖼️</span>
                <p style={{ margin: 0, fontSize: 13 }}>Enter YouTube details on the left and click extract to view your looping GIF sticker preview.</p>
              </div>
            )}

            {/* Error screen */}
            {gifStatus === 'error' && (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #ef4444',
                color: '#fca5a5'
              }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#ef4444' }}>Extraction Failed</h3>
                <p style={{ margin: '4px 0', fontSize: 12, lineHeight: 1.4 }}>{gifErrorMsg}</p>
                <button
                  type="button"
                  onClick={() => setGifStatus('idle')}
                  style={{
                    background: '#334155',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 12,
                    alignSelf: 'flex-start'
                  }}
                >
                  Reset Extractor
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Stickers Gallery */}
          <div style={{
            background: '#1e293b',
            borderRadius: 16,
            padding: 20,
            border: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#a855f7' }}>3. Stickers Gallery</h2>

            {loadingStickers ? (
              <div style={{ color: '#64748b', fontSize: 12 }}>Loading gallery...</div>
            ) : recentStickers.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 12 }}>No extracted stickers found in R2.</div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxHeight: '75vh',
                overflowY: 'auto'
              }}>
                {recentStickers.map((sticker) => (
                  <div
                    key={sticker.key}
                    style={{
                      background: '#0f172a',
                      borderRadius: 10,
                      padding: 10,
                      border: '1px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: 50,
                      height: 50,
                      background: '#1e293b',
                      borderRadius: 6,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid #334155'
                    }}>
                      <img
                        src={sticker.url}
                        alt="sticker thumbnail"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>

                    {/* Metadata details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#f8fafc',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {sticker.linguistics?.singular || sticker.key.split('/').pop().replace(/^[0-9]+-/, '').replace(/\.gif$/, '')}
                      </div>
                      <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                        {sticker.dimensions?.width}x{sticker.dimensions?.height} • {sticker.size ? `${(sticker.size / 1024).toFixed(1)} KB` : 'N/A'}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setExtractedGifUrl(sticker.url);
                          setExtractedGifData({
                            name: sticker.linguistics?.singular || sticker.key.split('/').pop().replace(/^[0-9]+-/, '').replace(/\.gif$/, ''),
                            dimensions: sticker.dimensions || { width: 300, height: 300 },
                            sizeBytes: sticker.size || 0,
                            key: sticker.key
                          });
                          setGifStatus('completed');
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#334155',
                          color: '#e2e8f0',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        👁️ Load
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sticker.url);
                          alert('Sticker CDN URL copied!');
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#1e293b',
                          color: '#cbd5e1',
                          border: '1px solid #334155',
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        🔗 Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spinner animation definition */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
