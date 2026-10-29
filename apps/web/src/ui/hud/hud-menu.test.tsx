import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGameStore } from '../../game-bridge/game-store';
import { GameStoreContext } from '../../game-bridge/use-game-state';
import type { PlayerData } from '../player/player-data';
import { PROGRESS, questList } from '../player/test-fixtures';
import { Hud } from './hud';
import { HudMenu } from './hud-menu';
import { HOLD_HINT_LINGER_MS, HOLD_HINT_MS } from './use-hold-hint';

/** Window listeners a test added, removed after it. */
const stopListening: Array<() => void> = [];
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  stopListening.splice(0).forEach((stop) => stop());
});

const DATA: PlayerData = { character: { species: 'cat', name: 'Kem', equipped: [], pet: null }, progress: PROGRESS, quests: questList(1).quests };

function renderHud(props: Partial<Parameters<typeof Hud>[0]> = {}) {
  const store = createGameStore();
  const sent: string[] = [];
  store.onCommand((c) => sent.push(c.type));
  const calls = { menu: vi.fn(), quests: vi.fn(), backpack: vi.fn() };
  render(
    <MemoryRouter>
      <GameStoreContext.Provider value={store}>
        <Hud data={DATA} quest={DATA.quests[0] ?? null} onMenu={calls.menu} onQuests={calls.quests} onBackpack={calls.backpack} {...props} />
      </GameStoreContext.Provider>
    </MemoryRouter>,
  );
  return { store, sent, calls };
}

const toggle = (): HTMLElement => screen.getByRole('button', { name: /^Menu/ });

describe('HUD menu', () => {
  it('keeps one menu button on screen, every old HUD action inside it, and closes after a pick', () => {
    const { calls } = renderHud({ menu: <button type="button" data-id="hud-friends">Bạn bè</button> });
    // Closed: none of the actions are on screen.
    expect((document.querySelector('[data-id="hud-menu-sheet"]') as HTMLElement).hidden).toBe(true);
    expect(screen.queryByRole('button', { name: 'Nhiệm vụ' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Bản đồ' })).toBeNull();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    const sheet = screen.getByRole('group', { name: 'Menu trò chơi' });
    expect([...sheet.querySelectorAll('[data-id]')].map((el) => el.getAttribute('data-id'))).toEqual(['hud-quests', 'hud-map', 'hud-backpack', 'hud-friends', 'hud-menu']);
    expect(screen.getByRole('link', { name: 'Bản đồ' }).getAttribute('href')).toBe('/map');
    // The first action takes the focus (keyboard play).
    expect(document.activeElement?.getAttribute('data-id')).toBe('hud-quests');

    fireEvent.click(screen.getByRole('button', { name: 'Ba lô' }));
    expect(calls.backpack).toHaveBeenCalled();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle());
    fireEvent.click(screen.getByRole('button', { name: 'Cài đặt · Về nhà' }));
    expect(calls.menu).toHaveBeenCalled();
    fireEvent.click(toggle());
    fireEvent.click(screen.getByRole('button', { name: 'Nhiệm vụ' }));
    expect(calls.quests).toHaveBeenCalled();
  });

  it('closes on Esc without the Esc reaching the game (Pause), and on a press outside it', () => {
    renderHud();
    const pause = vi.fn();
    window.addEventListener('keydown', pause);
    fireEvent.click(toggle());
    fireEvent.keyDown(screen.getByRole('button', { name: 'Nhiệm vụ' }), { key: 'Escape' });
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle());
    expect(pause).not.toHaveBeenCalled();
    window.removeEventListener('keydown', pause);

    fireEvent.click(toggle());
    fireEvent.pointerDown(document.body);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('carries the number of things waiting inside, or a dot for something new, in its look and its name', () => {
    const { rerender } = render(
      <HudMenu badge={3}>
        <button type="button">x</button>
      </HudMenu>,
    );
    expect(screen.getByRole('button', { name: 'Menu, có 3 điều mới' })).toBeTruthy();
    expect(document.querySelector('[data-id="hud-menu-badge"]')?.textContent).toBe('3');
    rerender(
      <HudMenu badge={12}>
        <button type="button">x</button>
      </HudMenu>,
    );
    expect(document.querySelector('[data-id="hud-menu-badge"]')?.textContent).toBe('9+');
    rerender(
      <HudMenu fresh>
        <button type="button">x</button>
      </HudMenu>,
    );
    expect(screen.getByRole('button', { name: 'Menu, có điều mới' })).toBeTruthy();
    expect(document.querySelector('[data-id="hud-menu-dot"]')).not.toBeNull();
    expect(document.querySelector('[data-id="hud-menu-badge"]')).toBeNull();
  });

  it('puts "Lái xe" in the menu and "Xuống xe" on screen only while she rides', () => {
    const { store } = renderHud();
    act(() => store.emit({ type: 'vehicle', vehicle: { name: 'Ván trượt đỏ', riding: false } }));
    expect(screen.queryByRole('button', { name: /Lái xe/ })).toBeNull(); // inside the closed menu
    fireEvent.click(toggle());
    expect(screen.getByRole('group', { name: 'Menu trò chơi' }).querySelector('[data-id="hud-ride"]')?.textContent).toContain('Lái xe');
    act(() => store.emit({ type: 'vehicle', vehicle: { name: 'Ván trượt đỏ', riding: true } }));
    const off = screen.getByRole('button', { name: /Xuống xe/ });
    expect(off.closest('[data-id="hud-menu-sheet"]')).toBeNull();
  });
});

describe('the game keys and the HUD buttons', () => {
  /** What the game hears: its keys arrive on window. */
  function gameKeys(): string[] {
    const heard: string[] = [];
    const listen = (event: KeyboardEvent): void => void heard.push(event.code);
    window.addEventListener('keydown', listen);
    stopListening.push(() => window.removeEventListener('keydown', listen));
    return heard;
  }

  it('opened with a tap or click, leaves the focus out of the menu: Space jumps and closes it, never opening Quests', () => {
    const heard = gameKeys();
    const { calls } = renderHud();
    toggle().focus();
    fireEvent.click(toggle(), { detail: 1 });
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    // The button gave its focus up, and none of the grid took it.
    expect(document.activeElement).toBe(document.body);
    fireEvent.keyDown(document.body, { key: ' ', code: 'Space' });
    expect(heard).toEqual(['Space']);
    expect(calls.quests).not.toHaveBeenCalled();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('opened with the keyboard, keeps Space and Enter on its own buttons, away from the game', () => {
    const heard = gameKeys();
    renderHud();
    fireEvent.click(toggle(), { detail: 0 });
    const first = screen.getByRole('button', { name: 'Nhiệm vụ' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: ' ', code: 'Space' });
    fireEvent.keyDown(first, { key: 'Enter', code: 'Enter' });
    expect(heard).toEqual([]);
    // Esc closes it and gives the focus back to its button, opened from the keyboard.
    fireEvent.keyDown(first, { key: 'Escape', code: 'Escape' });
    expect(document.activeElement).toBe(toggle());
  });

  it('closed with Esc after a click, does not keep the focus on its button (Space would open it again)', () => {
    renderHud();
    fireEvent.click(toggle(), { detail: 1 });
    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).not.toBe(toggle());
  });

  it('frees a label over a target clicked with the mouse, so Space after it jumps instead of interacting again', () => {
    const heard = gameKeys();
    renderHud();
    const onLabel = vi.fn();
    render(
      <button type="button" className="npc-label" onClick={onLabel}>
        Vẹt · Nói chuyện
      </button>,
    );
    const label = screen.getByRole('button', { name: 'Vẹt · Nói chuyện' });
    label.focus();
    fireEvent.click(label, { detail: 1 });
    expect(onLabel).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(label);
    // Focused from the keyboard (Tab), Space and Enter are the label's own.
    label.focus();
    fireEvent.keyDown(label, { key: ' ', code: 'Space' });
    expect(heard).toEqual([]);
  });
});

describe('icon-only HUD buttons', () => {
  it('have no Interact button, and name the menu button on a long press without opening it', () => {
    vi.useFakeTimers();
    const { store } = renderHud();
    act(() => store.emit({ type: 'interaction-prompt', prompt: { targetId: 'parrot-guide', kind: 'npc', name: 'Vẹt', label: 'Nói chuyện' } }));
    expect(screen.queryByRole('button', { name: /Tương tác/ })).toBeNull();
    expect(toggle().getAttribute('title')).toBe('Menu');

    fireEvent.pointerDown(toggle(), { pointerType: 'touch' });
    act(() => void vi.advanceTimersByTime(HOLD_HINT_MS + 10));
    expect(toggle().querySelector('.hud-hint')?.textContent).toBe('Menu');
    fireEvent.pointerUp(toggle(), { pointerType: 'touch' });
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('false'); // the long press only named it
    act(() => void vi.advanceTimersByTime(HOLD_HINT_LINGER_MS + 10));
    expect(toggle().querySelector('.hud-hint')).toBeNull();

    // A quick tap opens it; the mouse never waits for a hint.
    fireEvent.pointerDown(toggle(), { pointerType: 'touch' });
    fireEvent.pointerUp(toggle(), { pointerType: 'touch' });
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
  });

  it('shows the compact player chip: avatar in an XP ring, level tag, coins, the name kept for screen readers', () => {
    renderHud();
    const badge = document.querySelector('[data-id="player-badge"]');
    expect(badge?.classList.contains('player-badge--compact')).toBe(true);
    expect(document.querySelector('[data-id="player-level"]')?.textContent).toBe(`Lv.${PROGRESS.level}`);
    expect(document.querySelector('[data-id="player-coins"]')?.textContent).toContain(String(PROGRESS.coins));
    expect(document.querySelector('[data-id="player-name"]')?.classList.contains('visually-hidden')).toBe(true);
    expect(screen.getByRole('img', { name: /Kinh nghiệm|Cấp cao nhất/ })).toBeTruthy();
  });
});
