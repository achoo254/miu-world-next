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

function renderInvite(guest: boolean, props: { playing: boolean; done: number; covered: boolean; next?: string }) {
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
  localStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the invitation to keep a guest\'s progress', () => {
  it('shows after a finished quest, with the sign-up, and stays closed for the visit once put off', async () => {
    renderInvite(true, { playing: true, done: 2, covered: false });
    expect(await screen.findByText('Giữ lại tiến độ với tài khoản hoandat.com miễn phí')).toBeTruthy();
    expect(document.querySelector('[data-id="guest-invite-card-done"]')?.textContent).toBe('Đã xong 2 nhiệm vụ, hiện chỉ lưu trên máy này.');
    // A sign-up button: the server asks the account service to open on making an account.
    expect(screen.getByRole('link', { name: 'Đăng ký miễn phí' }).getAttribute('href')).toBe('/api/auth/start?signup=1');
    fireEvent.click(screen.getByRole('button', { name: 'Để sau' }));
    expect(document.querySelector('[data-id="guest-invite"]')).toBeNull();
    expect(sessionStorage.getItem('miu.guestInvite.dismissed')).toBe('1');
  });

  it('waits while a screen covers the game, and never shows to a signed-in player', async () => {
    renderInvite(true, { playing: true, done: 1, covered: true });
    await act(async () => undefined);
    expect(document.querySelector('[data-id="guest-invite"]')).toBeNull();
    cleanup();
    renderInvite(false, { playing: true, done: 1, covered: false });
    await act(async () => undefined);
    expect(document.querySelector('[data-id="guest-invite"]')).toBeNull();
  });

  it('shows after a few minutes of play without a finished quest', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderInvite(true, { playing: true, done: 0, covered: false });
    await act(async () => undefined);
    expect(document.querySelector('[data-id="guest-invite"]')).toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(GUEST_INVITE_AFTER_MS);
    });
    expect(document.querySelector('[data-id="guest-invite"]')).not.toBeNull();
  });

  it('brings the person back to the quest they were playing once signed up', async () => {
    renderInvite(true, { playing: true, done: 1, covered: false, next: '/play?region=cho-phien&quest=market-lesson' });
    const link = await screen.findByRole('link', { name: 'Đăng ký miễn phí' });
    link.addEventListener('click', (event) => event.preventDefault()); // jsdom does not navigate
    fireEvent.click(link);
    expect(JSON.parse(localStorage.getItem('miu.postLogin') ?? '{}')).toMatchObject({ next: '/play?region=cho-phien&quest=market-lesson' });
  });
});
