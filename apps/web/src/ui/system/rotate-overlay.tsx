// "Xoay ngang thiết bị để chơi": the game is played sideways only (owner, 29/10/2026). A touch device held upright on
// a game screen gets this full-screen card over everything, taking every touch, until it is turned; a computer with a
// mouse never sees it. The landing page, the legal pages, the parent area, worksheets and moderation read fine upright
// and are left alone. Where the browser allows it (fullscreen) the screen is also locked sideways (platform/landscape.ts).
import { useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';
import { bindLandscapeLock, UPRIGHT_TOUCH_QUERY } from '../../platform/landscape';
import { useAccount } from '../account/account-context';
import { T } from '../i18n/use-t';
import './rotate-overlay.css';

/** Pages outside the game, readable upright (a path equal to one, or under it). */
const UPRIGHT_PAGES = ['/privacy', '/terms', '/parent', '/kiem-duyet'];

/** Whether `pathname` is a page left usable upright; `/` only for a visitor who is not signed in (the landing page). */
export function readsUpright(pathname: string, signedOut: boolean): boolean {
  if (pathname === '/') return signedOut;
  return UPRIGHT_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
}

function subscribeUpright(notify: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const query = window.matchMedia(UPRIGHT_TOUCH_QUERY);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}

const uprightNow = (): boolean => typeof window.matchMedia === 'function' && window.matchMedia(UPRIGHT_TOUCH_QUERY).matches;

/** A touch screen held upright, following each turn of the device. */
export function useUprightTouch(): boolean {
  return useSyncExternalStore(subscribeUpright, uprightNow, () => false);
}

export function RotateOverlay() {
  const { pathname } = useLocation();
  const { state } = useAccount();
  const upright = useUprightTouch();
  useEffect(bindLandscapeLock, []);
  if (!upright || readsUpright(pathname, state.status === 'signed-out')) return null;
  return (
    <div className="rotate-overlay" role="alertdialog" aria-modal="true" aria-labelledby="rotate-overlay-title" data-id="rotate-overlay">
      <div className="rotate-overlay-card">
        <span className="rotate-overlay-device" aria-hidden="true">
          <span className="rotate-overlay-screen" />
        </span>
        <h2 id="rotate-overlay-title" className="rotate-overlay-title">
          <T k="rotate.title" />
        </h2>
        <p className="rotate-overlay-body">
          <T k="rotate.body" />
        </p>
      </div>
    </div>
  );
}
