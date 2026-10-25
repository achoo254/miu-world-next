import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGameStore } from '../../game-bridge/game-store';
import { GameStoreContext } from '../../game-bridge/use-game-state';
import type { PlayerData } from '../player/player-data';
import { PROGRESS, questList } from '../player/test-fixtures';
import { QuestTracker, TRACKER_FOLD_MS } from './hud';

const DATA: PlayerData = { character: { species: 'cat', name: 'Kem', equipped: [], pet: null }, progress: PROGRESS, quests: [] };
const quest = (done: number) => {
  const first = questList(done).quests[0];
  if (!first) throw new Error('no quest');
  return first;
};

function show(done = 0, { loaded = true } = {}) {
  const store = createGameStore();
  const sent = vi.fn();
  store.onCommand(sent);
  const view = (n: number) => (
    <GameStoreContext.Provider value={store}>
      <QuestTracker quest={quest(n)} data={DATA} />
    </GameStoreContext.Provider>
  );
  const utils = render(view(done));
  if (loaded) act(() => store.emit({ type: 'ready' }));
  return { store, sent, rerender: (n: number) => utils.rerender(view(n)) };
}

/** Opens the card from its one-line pill. */
const openCard = (): void => void fireEvent.click(screen.getByRole('button', { name: 'Mở nhiệm vụ hiện tại' }));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('QuestTracker folding', () => {
  it('starts as a one-line pill with the quest and its steps done, and opens into the card on a tap', () => {
    show();
    expect(screen.queryByText('Nhiệm vụ hiện tại')).toBeNull();
    const pill = screen.getByRole('button', { name: 'Mở nhiệm vụ hiện tại' });
    expect(pill.querySelector('[data-id="hud-tracker-pill-title"]')?.textContent).toBe(quest(0).quest.title);
    expect(pill.querySelector('[data-id="hud-tracker-pill-count"]')?.textContent).toBe('0/2');
    openCard();
    expect(screen.getByText('Nhiệm vụ hiện tại')).toBeTruthy();
    expect(document.querySelector('[data-id="hud-tracker-step"]')).not.toBeNull();
  });

  it('folds with its button, opens again from the pill, and folding is not a tap on the card', () => {
    const { store, sent } = show();
    act(() => store.emit({ type: 'autowalk-available', available: true }));
    openCard();
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn nhiệm vụ' }));
    expect(sent).not.toHaveBeenCalled();
    expect(screen.queryByText('Nhiệm vụ hiện tại')).toBeNull();
    openCard();
    expect(screen.getByText('Nhiệm vụ hiện tại')).toBeTruthy();
  });

  it('keeps the walk-there tap on the open card', () => {
    const { store, sent } = show();
    act(() => store.emit({ type: 'autowalk-available', available: true }));
    openCard();
    expect(screen.getByText('Chạm để tự đi tới')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Nhiệm vụ hiện tại'));
    expect(sent).toHaveBeenLastCalledWith({ type: 'autowalk-start' });
  });

  it('folds by itself after the quiet time, and a touch on the card restarts the count', () => {
    show();
    openCard();
    act(() => void vi.advanceTimersByTime(TRACKER_FOLD_MS - 1000));
    fireEvent.pointerDown(screen.getByLabelText('Nhiệm vụ hiện tại'));
    act(() => void vi.advanceTimersByTime(TRACKER_FOLD_MS - 1000));
    expect(screen.getByText('Nhiệm vụ hiện tại')).toBeTruthy();
    act(() => void vi.advanceTimersByTime(1500));
    expect(screen.queryByText('Nhiệm vụ hiện tại')).toBeNull();
    expect(screen.getByRole('button', { name: 'Mở nhiệm vụ hiện tại' })).toBeTruthy();
  });

  it('counts the quiet time from when the map is up, not while it loads', () => {
    const { store } = show(0, { loaded: false });
    openCard();
    act(() => void vi.advanceTimersByTime(TRACKER_FOLD_MS * 2));
    expect(screen.getByText('Nhiệm vụ hiện tại')).toBeTruthy();
    act(() => store.emit({ type: 'ready' }));
    act(() => void vi.advanceTimersByTime(TRACKER_FOLD_MS - 1000));
    expect(screen.getByText('Nhiệm vụ hiện tại')).toBeTruthy();
    act(() => void vi.advanceTimersByTime(1500));
    expect(screen.queryByText('Nhiệm vụ hiện tại')).toBeNull();
  });

  it('folds back to the pill when the quest moves on to its next step, its count moving on', () => {
    const { rerender } = show(0);
    openCard();
    rerender(1);
    expect(screen.queryByText('Nhiệm vụ hiện tại')).toBeNull();
    expect(document.querySelector('[data-id="hud-tracker-pill-count"]')?.textContent).toBe('1/2');
  });
});

describe('QuestTracker on a finished quest played again', () => {
  it('shows the step of the new run and offers the walk, not "done"', () => {
    const finished = quest(2);
    const replayed = { ...finished, progress: { ...finished.progress, completedSteps: finished.progress.completedSteps.slice(0, 1), run: 2 } };
    const store = createGameStore();
    render(
      <GameStoreContext.Provider value={store}>
        <QuestTracker quest={replayed} data={DATA} />
      </GameStoreContext.Provider>,
    );
    act(() => store.emit({ type: 'ready' }));
    act(() => store.emit({ type: 'autowalk-available', available: true }));
    expect(document.querySelector('[data-id="hud-tracker-pill-count"]')?.textContent).toBe('1/2');
    openCard();
    expect(screen.queryByText('Đã hoàn thành')).toBeNull();
    expect(screen.getByText('1/2')).toBeTruthy();
    expect(screen.getByText('Chạm để tự đi tới')).toBeTruthy();
  });
});
