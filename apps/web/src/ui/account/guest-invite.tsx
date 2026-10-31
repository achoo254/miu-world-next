// NEW SCREEN part (Master Plan §6, Tài khoản): playing as a guest (no sign-in): starting one from the landing page, and the invitation to keep the progress with a
// free hoandat.com account after a first real achievement (a quest finished, or a few minutes of play). The card follows
// `AccountValueCard` of @achoo254/app-shell (what the account keeps in the app's words, at most three, the shared
// "one account for every app" line and the sign-up button) in the game's own panel and buttons, since the game does
// not load the shell's stylesheet. Signing in keeps the guest's progress: the server turns the guest account into the
// new account, or merges it into the one the person already has.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { MeResponse } from '@miu/schema/account';
import type { QuestSummary } from '@miu/schema/game';
import { ApiError, api, errorMessage } from '../api-client';
import { T } from '../i18n/use-t';
import { Icon } from '../kit/art';
import { buttonClass } from '../kit/button';
import { Modal } from '../kit/modal';
import { useAccount, useOptionalAccount } from './account-context';
import { IdpSignInButton } from './idp-sign-in-button';
import './guest-invite.css';

/** A few minutes of play count as a first achievement. */
export const GUEST_INVITE_AFTER_MS = 5 * 60 * 1000;
/** The in-game invitation shows once per visit (the Home card stays while they play as a guest). */
const DISMISSED_KEY = 'miu.guestInvite.dismissed';

const BENEFITS = ['guest.benefitDevices', 'guest.benefitDaily', 'guest.benefitOnline'] as const;

/** Whether the signed-in account is a guest's. */
export function useIsGuest(): boolean {
  // Optional: screens rendered on their own (tests) have no account around them.
  const state = useOptionalAccount()?.state;
  return state?.status === 'signed-in' && state.me.parent.guest;
}

/** A first real achievement: a quest finished at least once. */
export const finishedAQuest = (quests: readonly QuestSummary[]): boolean => quests.some((q) => q.state === 'completed');

/** What a free account keeps, and the sign-up button. */
export function GuestSaveCard({ dataId }: { dataId: string }) {
  return (
    <section className="panel guest-card" data-id={dataId} aria-labelledby={`${dataId}-title`}>
      <h2 id={`${dataId}-title`} className="guest-card-title">
        <Icon name="key" size={28} />
        <T k="guest.cardTitle" />
      </h2>
      <ul className="guest-card-list">
        {BENEFITS.map((key) => (
          <li key={key}>
            <T k={key} />
          </li>
        ))}
        <li>
          <T k="guest.everyApp" />
        </li>
      </ul>
      <IdpSignInButton dataId={`${dataId}-sign-up`} label={<T k="guest.signUp" />} />
    </section>
  );
}

/**
 * The invitation over the game: once a quest is finished or after GUEST_INVITE_AFTER_MS of play, when nothing else
 * covers the game (after the reward screens), once per visit. Nothing for a signed-in player.
 */
export function GuestInvite({ playing, achieved, covered }: { playing: boolean; achieved: boolean; covered: boolean }) {
  const guest = useIsGuest();
  const [played, setPlayed] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISSED_KEY) === '1');
  useEffect(() => {
    if (!guest || !playing || played) return;
    const timer = window.setTimeout(() => setPlayed(true), GUEST_INVITE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [guest, playing, played]);
  if (!guest || dismissed || covered || !(achieved || played)) return null;
  const close = (): void => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };
  return (
    <Modal title={<T k="guest.inviteTitle" />} onClose={close} dataId="guest-invite">
      <GuestSaveCard dataId="guest-invite-card" />
      <button type="button" className={buttonClass('ghost', { block: true })} data-id="guest-invite-later" onClick={close}>
        <T k="guest.later" />
      </button>
    </Modal>
  );
}

/** "Chơi ngay" on the web: starts a guest account and goes on to the policy, the character and the game. */
export function useStartGuest(): { start: () => void; busy: boolean; error: string | null } {
  const { setMe, refresh } = useAccount();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = (): void => {
    setBusy(true);
    setError(null);
    api('POST', '/auth/guest', MeResponse)
      .then((me) => {
        setMe(me);
        navigate('/', { replace: true });
      })
      .catch(async (err: unknown) => {
        // Already signed in (another tab): just go on with that account.
        if (err instanceof ApiError && err.code === 'signed-in') {
          await refresh();
          navigate('/', { replace: true });
          return;
        }
        setError(errorMessage(err));
      })
      .finally(() => setBusy(false));
  };
  return { start, busy, error };
}
