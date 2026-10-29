// Modal dialog: focus moved in and kept inside (Tab cycles), Esc closes, focus returns to what was focused before.
// Over Home and the other pages a backdrop dims the page; over the running game nothing dims or blurs the world (an
// invisible layer still takes the taps beside the dialog, and only a soft shade sits right behind it: modal.css). The
// `scene` variant is for quest screens: no white panel, and the title sits on a banner (mock "quest screens"). Without a
// scrim (`scrim={false}`, a boss fight played out in the running world) a touch beside the dialog goes through to the
// game; focus and Esc stay.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import './modal.css';
import './scene.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  title,
  onClose,
  children,
  dataId,
  placement = 'center',
  size = 'normal',
  variant = 'panel',
  titleClass,
  className,
  scrim = true,
  scrollKey,
}: {
  /** Text, or `<T>` / `<Bi>` for the bilingual display. */
  title: ReactNode;
  onClose?: () => void;
  children: ReactNode;
  dataId?: string;
  /** `bottom` docks the panel at the bottom edge (NPC dialogue over the game); `top` at the top edge, so the middle and
   *  bottom of the game show under it (her pet beside her while its care board is open). */
  placement?: 'center' | 'bottom' | 'top';
  /** `wide` fits a challenge close-up. */
  size?: 'normal' | 'wide';
  /** `scene`: themed materials over the running game instead of a white panel. */
  variant?: 'panel' | 'scene';
  /** Class of the title element (`ribbon` banner by default in the scene variant). */
  titleClass?: string;
  /** Extra class of the dialog (a layout of its own, as the challenge scene's pinned header and bar). */
  className?: string;
  /** False: no dimming backdrop and no blocking of touches beside the dialog (the game shows and plays on). */
  scrim?: boolean;
  /**
   * Names the view the dialog shows; when it changes (a topic picked low in a long list opens its questions in the
   * same dialog), the dialog scrolls back to its top so the new view starts at its title, not part way down.
   */
  scrollKey?: string;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Latest onClose without re-running the focus effect on every render.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  // A new view starts at its top (the first render is at the top already).
  const shownKey = useRef(scrollKey);
  useEffect(() => {
    if (shownKey.current === scrollKey) return;
    shownKey.current = scrollKey;
    if (dialog.current) dialog.current.scrollTop = 0;
  }, [scrollKey]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = (): HTMLElement[] => [...el.querySelectorAll<HTMLElement>(FOCUSABLE)];
    // Without scrolling: a long screen opens at its top (a reading from its first line), not at its first button.
    (focusables()[0] ?? el).focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && close.current) {
        e.preventDefault();
        e.stopPropagation();
        close.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
      before?.focus();
    };
  }, []);

  return (
    <div className={`modal-backdrop modal-backdrop--${placement}${variant === 'scene' ? ' modal-backdrop--scene' : ''}${scrim ? '' : ' modal-backdrop--clear'}`} data-id={dataId ? `${dataId}-backdrop` : undefined}>
      <div
        ref={dialog}
        className={`${variant === 'scene' ? `modal scene-modal modal--${size}` : `panel modal modal--${size}`}${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-id={dataId}
      >
        <h2 id={titleId} className={titleClass ?? (variant === 'scene' ? 'ribbon' : 'modal-title')}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
