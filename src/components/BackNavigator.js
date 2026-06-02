'use client';

/**
 * BackNavigator
 * ─────────────────────────────────────────────────────────────────
 * 1. Floating back button on mobile/tablet (hidden on desktop ≥1024px)
 * 2. Intercepts Capacitor Android hardware back so app doesn't close
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/* Only the true home screen has no "back" destination */
const ROOT_PATHS = new Set(['/', '/home']);

export default function BackNavigator() {
  const router      = useRouter();
  const pathname    = usePathname();
  const exitTimer   = useRef(null);           // ← must be useRef, not plain object
  const [exitReady, setExitReady] = useState(false);
  const [pressed,   setPressed]   = useState(false);

  /* ── Derive visibility directly — no async state needed ───────── */
  const isRoot  = ROOT_PATHS.has(pathname);
  const isPractice = pathname.startsWith('/practice');
  const showBtn = !isRoot && !isPractice;                    // show on every non-home/non-practice page

  /* ── Navigate back ────────────────────────────────────────────── */
  const goBack = () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 180);

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  /* ── Capacitor hardware / gesture back button ─────────────────── */
  useEffect(() => {
    let cleanup;

    const setup = async () => {
      try {
        const { App } = await import('@capacitor/app');

        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          if (isRoot) {
            if (exitReady) {
              clearTimeout(exitTimer.current);
              App.exitApp();
            } else {
              setExitReady(true);
              clearTimeout(exitTimer.current);
              exitTimer.current = setTimeout(() => setExitReady(false), 2200);
            }
          } else {
            if (canGoBack) {
              window.history.back();
            } else {
              router.push('/');
            }
          }
        });

        cleanup = () => listener.remove();
      } catch {
        // Not in Capacitor — safe no-op on web
      }
    };

    setup();

    return () => {
      cleanup?.();
      clearTimeout(exitTimer.current);
    };
  }, [isRoot, exitReady, router]);

  /* ── Reset exit toast when route changes ─────────────────────── */
  useEffect(() => {
    setExitReady(false);
    clearTimeout(exitTimer.current);
  }, [pathname]);

  /* ──────────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────────────*/
  return (
    <>
      {/* "Press again to exit" toast — Capacitor Android only */}
      {exitReady && (
        <div className="back-exit-toast" role="alert" aria-live="assertive">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Press back again to exit
        </div>
      )}

      {/* Floating back button — CSS hides this on desktop ≥ 1024px */}
      {showBtn && (
        <button
          className={`back-nav-btn${pressed ? ' back-nav-btn--pressed' : ''}`}
          onClick={goBack}
          aria-label="Go back to previous page"
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
            stroke="currentColor" strokeWidth="2.8"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back</span>
        </button>
      )}
    </>
  );
}
