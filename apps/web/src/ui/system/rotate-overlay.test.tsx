import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lockLandscape, UPRIGHT_TOUCH_QUERY } from '../../platform/landscape';

const account = vi.hoisted(() => ({ status: 'signed-in' as 'signed-in' | 'signed-out' }));
vi.mock('../account/account-context', () => ({ useAccount: () => ({ state: { status: account.status } }) }));

const { RotateOverlay, readsUpright } = await import('./rotate-overlay');

/** A matchMedia whose upright-touch answer the test turns, telling the listeners as a real device does. */
function fakeScreen(upright: boolean): { turn: (next: boolean) => void } {
  const listeners = new Set<() => void>();
  let now = upright;
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query === UPRIGHT_TOUCH_QUERY ? now : false;
    },
    media: query,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }));
  return {
    turn(next) {
      now = next;
      for (const listener of listeners) listener();
    },
  };
}

const at = (path: string) => (
  <MemoryRouter initialEntries={[path]}>
    <RotateOverlay />
  </MemoryRouter>
);
const overlay = (): Element | null => document.querySelector('[data-id="rotate-overlay"]');

beforeEach(() => {
  account.status = 'signed-in';
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('RotateOverlay', () => {
  it('asks a touch screen held upright to turn sideways on a game screen, and goes once it is turned', () => {
    const device = fakeScreen(true);
    render(at('/play'));
    expect(screen.getByRole('alertdialog', { name: 'Xoay ngang thiết bị để chơi' })).toBeTruthy();
    act(() => device.turn(false));
    expect(overlay()).toBeNull();
    act(() => device.turn(true));
    expect(overlay()).not.toBeNull();
  });

  it('never shows sideways or with a mouse (the query is false there)', () => {
    fakeScreen(false);
    for (const path of ['/home', '/map', '/play']) {
      render(at(path));
      expect(overlay()).toBeNull();
      cleanup();
    }
  });

  it('leaves the pages outside the game usable upright', () => {
    fakeScreen(true);
    for (const path of ['/privacy', '/terms', '/parent', '/parent/worksheets/abc', '/kiem-duyet']) {
      render(at(path));
      expect(overlay(), path).toBeNull();
      cleanup();
    }
    account.status = 'signed-out';
    render(at('/'));
    expect(overlay()).toBeNull();
  });
});

describe('readsUpright', () => {
  it('lets the landing page read upright only for a visitor who is not signed in', () => {
    expect(readsUpright('/', true)).toBe(true);
    expect(readsUpright('/', false)).toBe(false);
    expect(readsUpright('/parentx', false)).toBe(false);
    expect(readsUpright('/home', true)).toBe(false);
  });
});

describe('lockLandscape', () => {
  it('asks the browser to hold the screen sideways and shrugs off a refusal', async () => {
    const lock = vi.fn(() => Promise.reject(new Error('not fullscreen')));
    vi.stubGlobal('screen', { orientation: { lock } });
    expect(() => lockLandscape()).not.toThrow();
    expect(lock).toHaveBeenCalledWith('landscape');
    await Promise.resolve();
  });

  it('does nothing where the browser cannot lock (Safari)', () => {
    vi.stubGlobal('screen', { orientation: {} });
    expect(() => lockLandscape()).not.toThrow();
  });
});
