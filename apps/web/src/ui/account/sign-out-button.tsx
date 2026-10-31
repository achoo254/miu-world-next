import { useState } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { api } from '../api-client';
import { buttonClass } from '../kit/button';
import { T } from '../i18n/use-t';
import { useAccount } from './account-context';
import { useIsGuest } from './guest-invite';
import { IdpSignInButton } from './idp-sign-in-button';
import { useSubmit } from './use-submit';

export function SignOutButton() {
  const { signOut } = useAccount();
  const navigate = useNavigate();
  const form = useSubmit(async () => {
    await api('POST', '/auth/logout', z.undefined());
    signOut();
    navigate('/login');
  });
  const guest = useIsGuest();
  const [warned, setWarned] = useState(false);
  if (guest && warned) {
    // A guest's progress lives under this device's session: leaving loses it, so say so and offer the account first.
    return (
      <div className="guest-sign-out" data-id="sign-out-guest">
        <p role="alert" className="hint">
          <T k="guest.signOutWarning" />
        </p>
        <IdpSignInButton dataId="sign-out-guest-sign-up" label={<T k="guest.signUp" />} />
        <button type="button" className={buttonClass('ghost')} data-id="sign-out-anyway" disabled={form.busy} onClick={() => void form.onSubmit()}>
          <T k="guest.signOutAnyway" />
        </button>
      </div>
    );
  }
  return (
    <button type="button" className={buttonClass('ghost')} data-id="sign-out" disabled={form.busy} onClick={() => (guest ? setWarned(true) : void form.onSubmit())}>
      <T k="gate.signOut" />
    </button>
  );
}
