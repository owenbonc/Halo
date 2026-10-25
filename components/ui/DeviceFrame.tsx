'use client';
import { usePathname } from 'next/navigation';
import { type ReactNode, Suspense, useLayoutEffect, useSyncExternalStore } from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';

const SCROLL_ROOT = 'data-scroll-root';

/*
 * The app shell (after bulk's demo). On a phone it is the page, full screen. With a mouse (the `frame` variant in
 * globals.css), at any window width, it draws an iPhone 16 Pro: a 402×874 screen, black
 * bezel and titanium rim on a dark desk, scaled to fit, with a fake status bar and home indicator. The screen
 * is the containing block for fixed layers, so toasts stay inside the phone.
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="device-stage">
      <div className="device-phone">
        <div className="device-screen">
          <div {...{ [SCROLL_ROOT]: '' }} className="device-scroll">
            {children}
          </div>
          <Suspense fallback={null}>
            <ScrollTopOnRoute />
          </Suspense>
          <StatusBar />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 left-1/2 z-50 hidden h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-ink frame:block"
          />
        </div>
      </div>
      <ThemeSwitcher />
    </div>
  );
}

// In the frame the app scrolls inside one element that Next's route change doesn't reset.
function ScrollTopOnRoute() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    if (pathname) appScroller().scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

/** The element the app scrolls in: the phone screen in the laptop frame, the document on a phone. */
export function appScroller(): HTMLElement {
  const frame = document.querySelector<HTMLElement>(`[${SCROLL_ROOT}]`);
  const framed = frame && getComputedStyle(frame).overflowY === 'auto';
  return framed ? frame : (document.scrollingElement as HTMLElement);
}

function subscribeClock(notify: () => void) {
  let timer = 0;
  const schedule = () => {
    timer = window.setTimeout(
      () => {
        notify();
        schedule();
      },
      60_000 - (Date.now() % 60_000) + 20,
    );
  };
  schedule();
  document.addEventListener('visibilitychange', notify);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', notify);
  };
}

const clock = () =>
  new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

// Fake iOS status bar, frame mode only: the viewer's real time, the Dynamic Island, signal, Wi-Fi, battery.
function StatusBar() {
  const time = useSyncExternalStore(subscribeClock, clock, () => '');
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-50 hidden h-[62px] font-[system-ui] text-ink select-none frame:block"
    >
      <div className="absolute inset-x-0 top-[11px] flex h-[37px] items-center">
        <div className="flex flex-1 items-center justify-center pl-[6px]">
          <span className="text-[17px] leading-none font-semibold tracking-[-0.025em] tabular-nums">
            {time}
          </span>
        </div>
        <div className="w-[125px] shrink-0" />
        <div className="flex flex-1 items-center justify-center gap-[6px] pr-[2px]">
          <svg aria-hidden="true" width="18" height="12" viewBox="0 0 18 12" className="shrink-0">
            <rect x="0" y="7.6" width="3.1" height="4.4" rx="1" fill="currentColor" />
            <rect x="4.95" y="5.4" width="3.1" height="6.6" rx="1" fill="currentColor" />
            <rect x="9.9" y="2.9" width="3.1" height="9.1" rx="1" fill="currentColor" />
            <rect x="14.85" y="0.4" width="3.1" height="11.6" rx="1" fill="currentColor" />
          </svg>
          <svg aria-hidden="true" width="17" height="12" viewBox="0 0 17 12" className="shrink-0">
            <path
              d="M1.5 4.4a9.9 9.9 0 0 1 14 0M3.87 6.77a6.55 6.55 0 0 1 9.26 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            <path
              d="M8.5 11.4 6.1 9a3.4 3.4 0 0 1 4.8 0Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          <svg aria-hidden="true" width="28" height="13" viewBox="0 0 28 13" className="shrink-0">
            <rect
              x="0.5"
              y="0.5"
              width="24"
              height="12"
              rx="3.8"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.38"
            />
            <path
              d="M25.9 4.4v4.2c.8-.3 1.3-1.1 1.3-2.1s-.5-1.8-1.3-2.1Z"
              fill="currentColor"
              fillOpacity="0.45"
            />
            <rect x="2" y="2" width="13.65" height="9" rx="2.4" fill="currentColor" />
          </svg>
        </div>
      </div>
      <div className="absolute top-[11px] left-1/2 h-[37px] w-[125px] -translate-x-1/2 rounded-full bg-[var(--device)]" />
    </div>
  );
}
