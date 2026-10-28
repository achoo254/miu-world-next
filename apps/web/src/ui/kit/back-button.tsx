// "Quay lại" on screens a child reaches from another screen (Backpack, Profile, Journey, the map…): back to where
// they came from, or Home when the screen was opened straight from a link (nothing in this tab to go back to).
import { useLocation, useNavigate } from 'react-router';
import { T } from '../i18n/use-t';
import { buttonClass } from './button';

export function BackButton({ dataId, fallback = '/home' }: { dataId: string; fallback?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  // React Router gives the first entry of the tab the key "default": there is no screen of ours behind it.
  const back = (): void => {
    if (location.key === 'default') void navigate(fallback);
    else void navigate(-1);
  };
  return (
    <button type="button" className={buttonClass('ghost', { small: true })} onClick={back} data-id={dataId}>
      <span aria-hidden="true">←</span>
      <T k="common.back" />
    </button>
  );
}
