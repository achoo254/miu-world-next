// The game is played sideways only (owner, 29/10/2026). The iPhone/Android app is locked to landscape by its own
// config (Info.plist, AndroidManifest.xml); on the web a touch device held upright gets a "turn it sideways" overlay
// (ui/system/rotate-overlay.tsx), and wherever the browser allows it (fullscreen: the installed PWA, or a page put in
// fullscreen) the screen is locked sideways too. A computer with a mouse is never asked to turn: a narrow window stays
// usable.

/** A touch screen held upright: the only case the game asks to be turned sideways. */
export const UPRIGHT_TOUCH_QUERY = '(orientation: portrait) and (pointer: coarse)';

/** The part of `ScreenOrientation` used here; `lock` is missing from some browsers' types and from Safari itself. */
interface LockableOrientation {
  lock?: (orientation: 'landscape') => Promise<void>;
}

/**
 * Asks the browser to hold the screen sideways. Browsers allow it only in fullscreen (and Safari not at all), so a
 * refusal is expected and ignored: the overlay still asks the player to turn the device.
 */
export function lockLandscape(): void {
  const orientation = (typeof screen === 'undefined' ? undefined : screen.orientation) as LockableOrientation | undefined;
  if (typeof orientation?.lock !== 'function') return;
  orientation.lock('landscape').catch(() => undefined);
}

/** Whether the page runs as the installed, fullscreen web app (the manifest's `display: fullscreen`). */
function installedFullscreen(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: fullscreen)').matches;
}

/**
 * Locks the screen sideways now if the page is already fullscreen, and again each time it enters fullscreen. Returns
 * the unbind.
 */
export function bindLandscapeLock(): () => void {
  if (installedFullscreen() || document.fullscreenElement) lockLandscape();
  const onFullscreen = (): void => {
    if (document.fullscreenElement) lockLandscape();
  };
  document.addEventListener('fullscreenchange', onFullscreen);
  return () => document.removeEventListener('fullscreenchange', onFullscreen);
}
