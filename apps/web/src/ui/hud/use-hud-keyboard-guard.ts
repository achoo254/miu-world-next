// The game's keys and the HUD's buttons share one keyboard: the game listens on window (Space jumps, E interacts,
// WASD walk) while a focused button also takes Space and Enter as a press. So that a key meant for the game never
// presses a HUD button:
// - a HUD control pressed with a pointer (mouse, finger) gives its focus up at once: focus stays on a HUD control only
//   when the player moved it there with the keyboard (Tab, or the menu opened with Enter);
// - a key that presses the focused control (Space, Enter) is the control's alone: the game does not also see it.
import { useEffect } from 'react';

/** The HUD's own controls over the game: its columns and menu, the label over a target, the contextual buttons. */
export const HUD_CONTROLS = '.hud-top-left, .hud-menu, .npc-label, .hud-rescue, .hud-ride';
/** What a focused button takes as a press. */
const PRESS_KEYS = new Set([' ', 'Enter']);

const hudControlOf = (target: EventTarget | null): HTMLElement | null => {
  if (!(target instanceof Element)) return null;
  const control = target.closest<HTMLElement>('button, a[href], [role="button"]');
  return control && control.closest(HUD_CONTROLS) ? control : null;
};

/** Keeps game keys and HUD buttons apart while the HUD is up (see the file comment). */
export function useHudKeyboardGuard(): void {
  useEffect(() => {
    const pressed = (event: MouseEvent): void => {
      // `detail` counts pointer clicks; a press from the keyboard has 0 and keeps its focus.
      if (event.detail === 0) return;
      hudControlOf(event.target)?.blur();
    };
    const keyed = (event: KeyboardEvent): void => {
      if (!PRESS_KEYS.has(event.key) || !hudControlOf(event.target)) return;
      // Caught on the way down, before the game's window listener: the button still gets its press (default action).
      event.stopPropagation();
    };
    document.addEventListener('click', pressed);
    document.addEventListener('keydown', keyed, true);
    return () => {
      document.removeEventListener('click', pressed);
      document.removeEventListener('keydown', keyed, true);
    };
  }, []);
}
