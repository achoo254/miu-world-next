// The sign-in button: the shared account service (auth-next). On the web it is a plain link to the server,
// which runs the whole OpenID Connect round trip (no IdP script in the page, CSP stays same-origin). In the
// iPhone/Android app it opens the system browser through the app's native sign-in (platform/native-session.ts), then
// reloads the account. `reauth` asks the IdP to sign the person in again: the confirmation account management needs to
// turn voice chat on for an extra player (the server reads it from the ID token, never from this page). `signUp` (a
// sign-up button) opens the IdP on making an account (`prompt=create`); plain sign-in buttons must not, since the
// account service counts the sign-up presses per app from it.
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { NATIVE_APP } from '../../platform/endpoints';
import { savePostLoginTarget } from '../../post-login-target';
import { ApiError } from '../api-client';
import { buttonClass } from '../kit/button';
import { T } from '../i18n/use-t';
import type { TextKey } from '../i18n/i18n';
import { useAccount } from './account-context';

/** Server-side sign-in start: the browser just navigates. */
export const SIGN_IN_START = '/api/auth/start';
/** A re-authentication from account management, which the server sends back there (its only allowed return path). */
export const REAUTH_START = `${SIGN_IN_START}?intent=reauth&return=%2Fparent`;
/** A sign-up: the server asks the IdP to open on making an account. */
export const SIGN_UP_START = `${SIGN_IN_START}?signup=1`;

/** Where the server sends a sign-up back: account management when it started there, else the start ('/'). */
export type SignUpReturn = '/parent';

/** The web's start address for a button. */
export function signInHref({ reauth = false, signUp = false, returnTo }: { reauth?: boolean; signUp?: boolean; returnTo?: SignUpReturn }): string {
  if (reauth) return REAUTH_START;
  if (!signUp) return SIGN_IN_START;
  return returnTo ? `${SIGN_UP_START}&return=${encodeURIComponent(returnTo)}` : SIGN_UP_START;
}

/** The message of a sign-in failure code: `/login?error=…` on the web, the API error in the app. */
export function signInErrorKey(code: string): TextKey {
  switch (code) {
    case 'idp-unavailable':
      return 'auth.callback.unavailable';
    case 'idp-conflict':
      return 'auth.callback.conflict';
    case 'idp-email-unverified':
      return 'auth.callback.emailUnverified';
    case 'idp-google-mismatch':
      return 'auth.callback.googleMismatch';
    case 'rate-limited':
      return 'auth.callback.rateLimited';
    case 'idp-reauth':
      return 'auth.callback.reauth';
    default:
      return 'auth.callback.idp';
  }
}

interface IdpSignInButtonProps {
  dataId: string;
  label: ReactNode;
  reauth?: boolean;
  /** A sign-up button: the IdP opens on making an account. */
  signUp?: boolean;
  /** Where the server brings a sign-up back (account management); otherwise the start. */
  returnTo?: SignUpReturn;
  /** A game path to open again once signed in (the quest being played), kept on this device until Home is reached. */
  next?: string;
  /**
   * The app's sign-in finished in place (the web leaves the page and comes back through the server instead), so the
   * screen can go on with what asked for it.
   */
  onSignedIn?: () => void;
}

export function IdpSignInButton({ dataId, label, reauth = false, signUp = false, returnTo, next, onSignedIn }: IdpSignInButtonProps) {
  const { refresh } = useAccount();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TextKey | null>(null);
  const keepNext = (): void => {
    if (next) savePostLoginTarget({ next });
  };
  if (!NATIVE_APP) {
    return (
      <a className={buttonClass('primary', { block: true })} href={signInHref({ reauth, signUp, returnTo })} data-id={dataId} onClick={keepNext}>
        {label}
      </a>
    );
  }
  const run = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    keepNext();
    try {
      const { startNativeSignIn } = await import('../../platform/native-session');
      if (await startNativeSignIn(reauth, signUp)) {
        await refresh();
        onSignedIn?.();
        // A re-authentication stays where it was asked for (account management).
        if (!reauth) navigate('/');
      }
    } catch (err) {
      setError(signInErrorKey(err instanceof ApiError ? err.code : 'idp'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {error ? (
        <p role="alert" className="error">
          <T k={error} />
        </p>
      ) : null}
      <button type="button" className={buttonClass('primary', { block: true })} data-id={dataId} disabled={busy} onClick={() => void run()}>
        {label}
      </button>
    </>
  );
}
