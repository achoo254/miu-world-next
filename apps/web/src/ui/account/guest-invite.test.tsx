import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountProvider } from './account-context';
import { GUEST_INVITE_AFTER_MS, GuestInvite } from './guest-invite';

const ME = (guest: boolean) => ({
  parent: { id: '1b0e8e0c-6f1a-4b8e-9a53-1f1c2a3b4c5d', email: guest ? 'guest-x@guest.invalid' : 'p@example.vn', guest },
  consentAccepted: true,
  activePlayerId: '0b0e8e0c-6f1a-4b8e-9a53-1f1c2a3b4c5d',
  players: [],
});

function renderInvite(guest: boolean, props: { playing: boolean; achieved: boolean; covered: boolean }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(ME(guest)), { status: 200 })),
  );
  return render(
    <MemoryRouter>
      <AccountProvider>
        <GuestInvite {...props} />
      </AccountProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the invitation to keep a guest\'s progress', () => {
  it('shows after a finished quest, with the sign-up, and stays closed for the visit once put off', async () => {
    renderInvite(true, { playing: true, achieved: true, covered: false });
    expect(await screen.findByText('Giữ lại tiến độ với tài khoản hoandat.com miễn phí')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Đăng ký miễn phí' }).getAttribute('href')).toBe('/api/auth/start');
    fireEvent.click(screen.getByRole('button', { name: 'Để sau' }));
    expect(document.querySelector('[data-id="guest-invite"]')).toBeNull();
    expect(sessionStorage.getItem('miu.guestInvite.dismissed')).toBe('1');
  });

  it('waits while a screen covers the game, and never shows to a signed-in player', async () => {
    renderInvite(true, { playing: true, achieved: true, covered: true });
    await act(async () => undefined);
    expect(document.querySelector('[data-id="guest-invite"]')).toBeNull();
    cleanup();
    renderInvite(false, { playing: true, achieved: true, covered: false });
    await act(async () => undefined);
    expect(document.querySelector('[data-id="guest-invite"]')).toBeNull();
  });

  it('shows after a few minutes of play without a finished quest', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderInvite(true, { playing: true, achieved: false, covered: false });
    await act(async () => undefined);
    expect(document.querySelector('[data-id="guest-invite"]')).toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(GUEST_INVITE_AFTER_MS);
    });
    expect(document.querySelector('[data-id="guest-invite"]')).not.toBeNull();
  });
});
