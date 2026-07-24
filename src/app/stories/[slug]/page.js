'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { KIDS_STORIES } from '@/lib/stories/storiesData';

function FormattedStoryText({ text }) {
  if (!text) return null;

  // 1. Convert escaped literal "\n" into real newlines
  const cleanText = String(text).replace(/\\n/g, '\n');

  // 2. Split text by newlines
  const lines = cleanText.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} style={{ height: '6px' }} />;

        // Convert markdown bold (**text**), italic (*text*), and highlights
        let htmlContent = line
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a; font-weight: 800;">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em style="color: #334155;">$1</em>')
          .replace(/==(.*?)==/g, '<mark style="background: #fef08a; padding: 2px 6px; border-radius: 4px;">$1</mark>');

        return (
          <p
            key={idx}
            style={{
              fontSize: '20px',
              fontWeight: 700,
              lineHeight: 1.6,
              color: '#0f172a',
              margin: 0
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        );
      })}
    </div>
  );
}

export default function StoryReaderPage() {
  const params = useParams();
  const slug = params?.slug;

  const defaultStory = KIDS_STORIES.find(s => s.slug === slug) || KIDS_STORIES[0];
  const [story, setStory] = useState(defaultStory);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeVocab, setActiveVocab] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const synthRef = useRef(null);

  useEffect(() => {
    if (slug) {
      fetch(`/api/stories?slug=${slug}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.story) {
            setStory(data.story);
          }
        })
        .catch(err => console.error(err));
    }
  }, [slug]);

  const pagesList = Array.isArray(story.pages) && story.pages.length > 0 ? story.pages : defaultStory.pages;
  const currentPage = pagesList[currentPageIndex] || pagesList[0];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const currentAudioRef = useRef(null);

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlayingAudio(false);
  };

  const speakText = (text, customAudioUrl) => {
    stopAudio();

    const targetAudioUrl = customAudioUrl || currentPage?.audioUrl;

    if (targetAudioUrl) {
      try {
        const audio = new Audio(targetAudioUrl);
        currentAudioRef.current = audio;
        setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => {
          setIsPlayingAudio(false);
          if (synthRef.current && text) {
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.85;
            u.onstart = () => setIsPlayingAudio(true);
            u.onend = () => setIsPlayingAudio(false);
            synthRef.current.speak(u);
          }
        };
        audio.play().catch(() => setIsPlayingAudio(false));
        return;
      } catch (e) {
        console.error(e);
      }
    }

    if (!synthRef.current || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    synthRef.current.speak(utterance);
  };

  const handleNextPage = () => {
    stopAudio();
    setActiveVocab(null);

    if (currentPageIndex < story.pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handlePrevPage = () => {
    stopAudio();
    setActiveVocab(null);
    setActiveVocab(null);

    if (showQuiz) {
      setShowQuiz(false);
    } else if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const handleQuizSelect = (qIdx, optIdx) => {
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    story.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) score++;
    });
    return score;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fef3c7 0%, #e0f2fe 100%)',
      fontFamily: 'var(--font-outfit), "Outfit", "Inter", sans-serif',
      color: '#1e293b',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Navbar */}
      <header style={{
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <Link href="/stories" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#2563eb',
          fontWeight: 800,
          textDecoration: 'none',
          fontSize: '15px'
        }}>
          ⬅️ Back to Library
        </Link>

        <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
          {story.title}
        </h1>

        <div style={{
          background: '#f1f5f9',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 700,
          color: '#475569'
        }}>
          Page {showQuiz ? 'Quiz' : `${currentPageIndex + 1} of ${story.pages.length}`}
        </div>
      </header>

      {/* Main Storybook Container */}
      <main style={{
        flex: 1,
        maxWidth: '900px',
        width: '100%',
        margin: '24px auto',
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {!showQuiz ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid rgba(226, 232, 240, 0.8)'
          }}>
            {/* Story Page Image */}
            <div style={{
              height: '340px',
              background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '20px'
            }}>
              <img
                src={currentPage.image}
                alt={`Page ${currentPage.pageNumber}`}
                style={{
                  maxHeight: '300px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.12)'
                }}
              />

              {/* Sound Bubble */}
              {currentPage.sound && (
                <button
                  onClick={() => speakText(currentPage.sound)}
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(245, 158, 11, 0.4)'
                  }}
                >
                  🔊 {currentPage.sound}
                </button>
              )}
            </div>

            {/* Narration Bar & Controls */}
            <div style={{
              padding: '24px 32px',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => speakText(currentPage.text)}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: isPlayingAudio ? '#ef4444' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '22px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {isPlayingAudio ? '⏹️' : '🔊'}
                </button>

                <FormattedStoryText text={currentPage.text} />
              </div>

              {/* Vocab Helper Tags */}
              {currentPage.vocab && currentPage.vocab.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748b' }}>
                    💡 Tap words to learn:
                  </span>
                  {currentPage.vocab.map(v => (
                    <button
                      key={v.word}
                      onClick={() => {
                        setActiveVocab(v);
                        speakText(v.word + ": " + v.definition);
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '12px',
                        background: '#e0e7ff',
                        color: '#4338ca',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {v.word}
                    </button>
                  ))}
                </div>
              )}

              {/* Active Vocab Popup */}
              {activeVocab && (
                <div style={{
                  background: '#f5f3ff',
                  border: '1.5px solid #c7d2fe',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  marginTop: '6px'
                }}>
                  <div style={{ fontWeight: 900, color: '#4338ca', fontSize: '15px' }}>
                    🌟 {activeVocab.word}
                  </div>
                  <div style={{ color: '#3730a3', fontSize: '14px', marginTop: '4px' }}>
                    {activeVocab.definition}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Comprehension Quiz Screen */
          <div style={{
            background: '#ffffff',
            borderRadius: '28px',
            padding: '36px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '650px',
            border: '2px solid rgba(226, 232, 240, 0.8)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0', textAlign: 'center' }}>
              🌟 Story Quiz & Star Reward!
            </h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              Answer the questions below to test your understanding!
            </p>

            {(() => {
              const validQuiz = (story.quiz || []).filter(q =>
                q && q.question && q.question.trim() && Array.isArray(q.options) && q.options.some(o => o && o.trim())
              );

              if (validQuiz.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: '64px', marginBottom: '12px' }}>🎉 🏆 🌟</div>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#10b981', margin: '0 0 8px 0' }}>
                      Great Job! You Completed the Story!
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>
                      You earned 5 Reading Stars for completing "{story.title}"!
                    </p>
                    <Link
                      href="/stories"
                      style={{
                        display: 'inline-block',
                        padding: '14px 28px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: '#ffffff',
                        fontWeight: 800,
                        textDecoration: 'none',
                        boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)'
                      }}
                    >
                      📖 Read Another Story
                    </Link>
                  </div>
                );
              }

              return (
                <>
                  {validQuiz.map((q, qIdx) => (
                    <div key={qIdx} style={{ marginBottom: '24px' }}>
                      <p style={{ fontWeight: 800, fontSize: '16px', color: '#1e293b', marginBottom: '12px' }}>
                        {qIdx + 1}. {q.question}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(q.options || []).filter(Boolean).map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            onClick={() => handleQuizSelect(qIdx, optIdx)}
                            style={{
                              padding: '12px 18px',
                              borderRadius: '14px',
                              border: quizAnswers[qIdx] === optIdx ? '2px solid #2563eb' : '1px solid #e2e8f0',
                              background: quizAnswers[qIdx] === optIdx ? '#eff6ff' : '#ffffff',
                              color: quizAnswers[qIdx] === optIdx ? '#1d4ed8' : '#334155',
                              fontWeight: 700,
                              fontSize: '14px',
                              textAlign: 'left',
                              cursor: 'pointer'
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {!quizSubmitted ? (
                    <button
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(quizAnswers).length < validQuiz.length}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '16px',
                        background: Object.keys(quizAnswers).length < validQuiz.length
                          ? '#cbd5e1'
                          : 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '16px',
                        border: 'none',
                        cursor: Object.keys(quizAnswers).length < validQuiz.length ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Submit Answers
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
                      <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#10b981', margin: 0 }}>
                        You Scored {calculateScore()} / {validQuiz.length} Stars!
                      </h3>
                      <Link
                        href="/stories"
                        style={{
                          display: 'inline-block',
                          marginTop: '20px',
                          padding: '12px 24px',
                          borderRadius: '16px',
                          background: '#2563eb',
                          color: '#ffffff',
                          fontWeight: 800,
                          textDecoration: 'none'
                        }}
                      >
                        Read Another Story
                      </Link>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Story Pagination Navigation Bar */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginTop: '24px'
        }}>
          <button
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0 && !showQuiz}
            style={{
              padding: '12px 24px',
              borderRadius: '16px',
              border: 'none',
              background: currentPageIndex === 0 && !showQuiz ? '#e2e8f0' : '#ffffff',
              color: currentPageIndex === 0 && !showQuiz ? '#94a3b8' : '#0f172a',
              fontWeight: 800,
              cursor: currentPageIndex === 0 && !showQuiz ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            ⬅️ Previous Page
          </button>

          {!showQuiz && (
            <button
              onClick={handleNextPage}
              style={{
                padding: '12px 28px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)'
              }}
            >
              {currentPageIndex === story.pages.length - 1 ? 'Take Story Quiz 🏆' : 'Next Page ➡️'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
