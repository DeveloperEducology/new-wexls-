'use client';

import React, { useEffect, useState } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 0. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('ServiceWorker registered with scope:', reg.scope))
        .catch((err) => console.error('ServiceWorker registration failed:', err));
    }

    // 1. Check if already installed / running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if user previously dismissed the prompt in this session
    const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (isDismissed) {
      return;
    }

    // 3. Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show our custom premium installation prompt
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      console.log('WEXLS App was successfully installed!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Don't show it again during this tab session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!isVisible || isInstalled) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pwaSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .pwa-toast {
          animation: pwaSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.3), 
                      0 0 0 1px rgba(122, 86, 214, 0.15);
          transition: all 0.3s ease;
        }

        .pwa-toast:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.35), 
                      0 0 0 1px rgba(122, 86, 214, 0.3);
        }

        .pwa-btn-install {
          background: linear-gradient(135deg, #7a56d6 0%, #6366f1 100%);
          transition: all 0.2s ease;
        }

        .pwa-btn-install:hover {
          background: linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%);
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(122, 86, 214, 0.3);
        }

        .pwa-btn-close {
          transition: all 0.2s ease;
        }

        .pwa-btn-close:hover {
          background: rgba(15, 23, 42, 0.08);
          color: #0f172a;
        }

        @media (max-width: 640px) {
          .pwa-toast {
            left: 16px !important;
            right: 16px !important;
            bottom: 16px !important;
            width: auto !important;
          }
        }
      `}} />
      
      <div 
        className="pwa-toast"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '380px',
          zIndex: 9999,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Logo Icon */}
          <div 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7a56d6 0%, #0ea5e9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(122, 86, 214, 0.25)',
              flexShrink: 0,
            }}
          >
            {/* Minimal white symbol representing the graduation cap and orbit */}
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
            </svg>
          </div>

          {/* Text content */}
          <div style={{ flexGrow: 1 }}>
            <h3 
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.2,
              }}
            >
              Install WEXLS Labs
            </h3>
            <p 
              style={{
                margin: '4px 0 0 0',
                fontSize: '12.5px',
                color: '#475569',
                lineHeight: 1.3,
              }}
            >
              Access practice rooms instantly from your home screen. Works offline!
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button
            onClick={handleDismiss}
            className="pwa-btn-close"
            style={{
              flex: '1 1 0',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(15, 23, 42, 0.04)',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            Not Now
          </button>
          
          <button
            onClick={handleInstallClick}
            className="pwa-btn-install"
            style={{
              flex: '2 2 0',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            Install App
          </button>
        </div>
      </div>
    </>
  );
}
