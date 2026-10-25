// M3.2 HUD, compact (owner, 25/10/2026: the HUD took too much of an iPhone or iPad, touch HUDs of block games as the
// model): ONE menu button at the top right, with a badge when something waits, opens a small grid of every action the
// HUD used to spread over the screen (quests, map, backpack, friends, the pet, today's lesson, riding, pause and
// settings). The grid stays mounted while closed (`hidden`), so the buttons inside keep reading what they show; a screen
// over the game unmounts the HUD, so the grid is closed when the game shows again.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { T, useT } from '../i18n/use-t';
import { useHoldHint } from './use-hold-hint';
import './hud-menu.css';

/** The game's own keys (walk, jump, interact): pressed outside the open menu, she plays on and the menu closes. */
const GAME_KEYS = new Set(['Space', 'KeyE', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export function HudMenu({
  badge = 0,
  fresh = false,
  onAvoid,
  children,
}: {
  /** Things waiting for her (friend requests): the number on the button. */
  badge?: number;
  /** Something new inside without a number (today's lesson): a dot on the button. */
  fresh?: boolean;
  /** The button's and the grid's boxes (`key`), for the in-world label to keep off them. */
  onAvoid?: (key: string, el: HTMLElement | null) => void;
  /** The grid's buttons. A press on any of them closes it. */
  children: ReactNode;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const sheetId = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const hint = useHoldHint();
  /** Opened with the keyboard (Enter on the button): the focus moves into the grid, and back to the button after. */
  const byKeys = useRef(false);
  // While open: a press anywhere else (the stick, the world) closes it, so does a pick of one of its actions or a game
  // key pressed outside it (she plays on), and Esc closes it only (caught before the game's own Esc, which opens Pause,
  // can see it).
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent): void => {
      if (event.target instanceof Node && root.current?.contains(event.target)) return;
      setOpen(false);
    };
    const picked = (event: MouseEvent): void => {
      const action = event.target instanceof Element ? event.target.closest('button, a[href]') : null;
      if (action && sheet.current?.contains(action)) setOpen(false);
    };
    const escape = (event: KeyboardEvent): void => {
      if (GAME_KEYS.has(event.code) && !(event.target instanceof Node && root.current?.contains(event.target))) {
        setOpen(false);
        return;
      }
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setOpen(false);
      if (byKeys.current) toggle.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('click', picked);
    document.addEventListener('keydown', escape, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('click', picked);
      document.removeEventListener('keydown', escape, true);
    };
  }, [open]);
  // Opened from the keyboard, the first action takes the focus; opened with a tap or a click, the focus stays out of the
  // grid, so the game's keys (Space) never press one of its buttons.
  useEffect(() => {
    if (open && byKeys.current) sheet.current?.querySelector<HTMLElement>('button:not(:disabled), a[href]')?.focus();
  }, [open]);

  const label = badge > 0 ? t('hud.menuNews', { count: badge }) : fresh ? t('hud.menuFresh') : t('common.menu');

  return (
    <div
      className="hud-menu"
      ref={(el) => {
        root.current = el;
        onAvoid?.('hud-menu', el);
      }}
    >
      <button
        type="button"
        ref={toggle}
        className="hud-menu-toggle"
        data-id="hud-menu-toggle"
        aria-label={label}
        aria-expanded={open}
        aria-controls={sheetId}
        title={t('common.menu')}
        onClick={(event) => {
          // `detail` counts pointer clicks; Enter or Space on the focused button gives 0.
          byKeys.current = event.detail === 0;
          setOpen((was) => !was);
        }}
        {...hint.bind}
      >
        <span className="hud-menu-bars" aria-hidden="true" data-open={open || undefined}>
          <span />
          <span />
          <span />
        </span>
        <span className="hud-menu-toggle-label" aria-hidden="true">
          <T k="common.menu" />
        </span>
        {badge > 0 ? (
          <span className="hud-menu-badge" data-id="hud-menu-badge" aria-hidden="true">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : fresh ? (
          <span className="hud-menu-dot" data-id="hud-menu-dot" aria-hidden="true" />
        ) : null}
        {hint.shown ? (
          <span className="hud-hint hud-hint--below" aria-hidden="true">
            <T k="common.menu" />
          </span>
        ) : null}
      </button>
      <div
        id={sheetId}
        ref={(el) => {
          sheet.current = el;
          onAvoid?.('hud-menu-sheet', el);
        }}
        className="hud-menu-sheet"
        data-id="hud-menu-sheet"
        role="group"
        aria-label={t('hud.menuLabel')}
        hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}
