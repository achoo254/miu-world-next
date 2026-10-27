import { useNavigate } from 'react-router';
import { z } from 'zod';
import { api } from '../api-client';
import { buttonClass } from '../kit/button';
import { T } from '../i18n/use-t';
import { useAccount } from './account-context';
import { useSubmit } from './use-submit';

export function SignOutButton() {
  const { signOut } = useAccount();
  const navigate = useNavigate();
  const form = useSubmit(async () => {
    await api('POST', '/auth/logout', z.undefined());
    signOut();
    navigate('/login');
  });
  return (
    <button type="button" className={buttonClass('ghost')} data-id="sign-out" disabled={form.busy} onClick={() => void form.onSubmit()}>
      <T k="gate.signOut" />
    </button>
  );
}
