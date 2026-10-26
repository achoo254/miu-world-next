// The two public legal pages, side by side wherever a page links to them (home foot, sign-in, invite page). The caller
// gives the container; each link is a 44 px touch target there.
import { Link } from 'react-router';
import { T } from '../i18n/use-t';

export function LegalLinks({ dataId }: { dataId: string }) {
  return (
    <>
      <Link to="/privacy" data-id={`${dataId}-privacy`}>
        <T k="auth.privacyLink" />
      </Link>
      <Link to="/terms" data-id={`${dataId}-terms`}>
        <T k="auth.termsLink" />
      </Link>
    </>
  );
}
