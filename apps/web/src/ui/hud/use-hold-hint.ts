// A short label for an icon-only HUD button, shown while a finger rests on it (a long press), the way touch games
// name their buttons without spelling them out on screen. A press held long enough only shows the label: lifting the
// finger then does not also press the button. A quick tap presses it as usual; mouse and keyboard never see the hint
// (the button's `title` and accessible name cover them).
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';

/** How long a finger rests on the button before its label shows (ms). */
export const HOLD_HINT_MS = 450;
/** How long the label stays after the finger lifts (ms). */
export const HOLD_HINT_LINGER_MS = 1_200;

export interface HoldHint {
  /** The label is showing. */
  shown: boolean;
  /** Spread on the button. */
  bind: {
    onPointerDown: (event: PointerEvent) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
    onPointerLeave: () => void;
    onClickCapture: (event: MouseEvent) => void;
    onContextMenu: (event: MouseEvent) => void;
  };
}

export function useHoldHint(): HoldHint {
  const [shown, setShown] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const lingerTimer = useRef<number | null>(null);
  /** The current press showed the label: its click is swallowed. */
  const held = useRef(false);
  const clear = (timer: { current: number | null }): void => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(
    () => () => {
      clear(holdTimer);
      clear(lingerTimer);
    },
    [],
  );
  const release = (): void => {
    clear(holdTimer);
    if (!held.current) return;
    clear(lingerTimer);
    lingerTimer.current = window.setTimeout(() => setShown(false), HOLD_HINT_LINGER_MS);
  };
  return {
    shown,
    bind: {
      onPointerDown: (event) => {
        held.current = false;
        if (event.pointerType === 'mouse') return;
        clear(holdTimer);
        holdTimer.current = window.setTimeout(() => {
          held.current = true;
          clear(lingerTimer);
          setShown(true);
        }, HOLD_HINT_MS);
      },
      onPointerUp: release,
      onPointerCancel: release,
      onPointerLeave: release,
      onClickCapture: (event) => {
        if (!held.current) return;
        held.current = false;
        event.preventDefault();
        event.stopPropagation();
      },
      // A long press on a phone would open the system's menu over the game.
      onContextMenu: (event) => event.preventDefault(),
    },
  };
}
