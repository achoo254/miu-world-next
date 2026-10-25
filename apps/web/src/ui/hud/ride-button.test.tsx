import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGameStore } from '../../game-bridge/game-store';
import { GameStoreContext } from '../../game-bridge/use-game-state';
import { RideButton } from './ride-button';

afterEach(cleanup);

describe('RideButton', () => {
  it('offers "Lái xe" in the menu with a vehicle equipped, and "Xuống xe" on screen only while she rides', () => {
    const store = createGameStore();
    const sent = vi.fn();
    store.onCommand(sent);
    render(
      <GameStoreContext.Provider value={store}>
        <div data-testid="menu">
          <RideButton place="menu" />
        </div>
        <div data-testid="screen">
          <RideButton place="screen" />
        </div>
      </GameStoreContext.Provider>,
    );
    expect(screen.queryByRole('button')).toBeNull();

    act(() => store.emit({ type: 'vehicle', vehicle: { name: 'Ván trượt đỏ', riding: false } }));
    const on = screen.getByRole('button', { name: /Lái xe/ });
    expect(screen.getByTestId('menu').contains(on)).toBe(true);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(on);
    expect(sent).toHaveBeenLastCalledWith({ type: 'ride', on: true });

    act(() => store.emit({ type: 'vehicle', vehicle: { name: 'Ván trượt đỏ', riding: true } }));
    const off = screen.getByRole('button', { name: /Xuống xe/ });
    expect(screen.getByTestId('screen').contains(off)).toBe(true);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(off.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(off);
    expect(sent).toHaveBeenLastCalledWith({ type: 'ride', on: false });

    act(() => store.emit({ type: 'vehicle', vehicle: null }));
    expect(screen.queryByRole('button')).toBeNull();
  });
});
