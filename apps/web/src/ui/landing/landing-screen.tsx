// NEW SCREEN (Master Plan §6, Tài khoản): the introduction a visitor who is not signed in sees at `/`, in place of a
// sign-in form: what the game is, the picture of its islands, a button to play (as a guest on the web, the sign-in screen in the app) and a way to the
// topic pages. No mock of its own; the sky, panel and buttons of the sign-in screens (direction A).
import { Link } from 'react-router';
import { TOPIC_SUBJECTS, subjectPagePath } from '@miu/schema/topic-pages';
import { Logo, SkyScene } from '../kit/sky-scene';
import { buttonClass } from '../kit/button';
import { HOME_ISLAND, assetUrl } from '../kit/ui-art';
import { T, useT } from '../i18n/use-t';
import { LegalLinks } from '../legal/legal-links';
import { NATIVE_APP } from '../../platform/endpoints';
import { useStartGuest } from '../account/guest-invite';
import './landing.css';

const BENEFITS = ['landing.benefitTopics', 'landing.benefitFriends', 'landing.benefitNotebook', 'landing.benefitFree'] as const;

/**
 * The web's "Chơi ngay": straight into the game as a guest, no sign-in (progress kept on this device until they sign in).
 * The app keeps its sign-in screen: it has no cookie to keep a guest in.
 */
function GuestPlayButton() {
  const guest = useStartGuest();
  return (
    <>
      <button type="button" className={buttonClass('primary', { block: true })} data-id="landing-play" disabled={guest.busy} onClick={guest.start}>
        <T k="landing.play" />
      </button>
      {guest.error ? (
        <p role="alert" className="error">
          {guest.error}
        </p>
      ) : null}
      <p className="hint" data-id="landing-guest-note">
        <T k="landing.guestNote" />
      </p>
    </>
  );
}

export function LandingScreen() {
  const { t } = useT();
  return (
    <SkyScene>
      <main className="scene-content landing" data-id="landing">
        <Logo />
        <div className="panel landing-panel">
          <div className="landing-text">
            <h1><T k="landing.title" /></h1>
            <p className="hint"><T k="landing.lead" /></p>
            {/* Right under the lead: on a phone the button is on the first screen, before the list. */}
            {NATIVE_APP ? (
              <Link to="/login" className={buttonClass('primary', { block: true })} data-id="landing-play">
                <T k="landing.play" />
              </Link>
            ) : (
              <GuestPlayButton />
            )}
            <p className="hint">
              <T k="landing.haveAccount" /> <Link to="/login" className="landing-login" data-id="landing-login"><T k="landing.loginLink" /></Link>
            </p>
            <ul className="landing-benefits">
              {BENEFITS.map((key) => (
                <li key={key}><T k={key} /></li>
              ))}
            </ul>
          </div>
          <img className="landing-image" src={assetUrl(HOME_ISLAND)} alt={t('landing.imageAlt')} width={1600} height={1000} draggable={false} />
        </div>
        {/* The topic pages are static files, not routes of this app: plain links, each page a fresh load. */}
        <nav className="landing-lessons" aria-labelledby="landing-lessons-heading" data-id="landing-lessons">
          <h2 id="landing-lessons-heading"><T k="landing.lessonsHeading" /></h2>
          <ul>
            {TOPIC_SUBJECTS.map((subject) => (
              <li key={subject.id}>
                <a className={buttonClass('ghost', { small: true })} href={subjectPagePath(subject)} data-id={`landing-subject-${subject.id}`}>
                  <T k="landing.subjectLessons" params={{ subject: subject.name }} />
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <footer className="note landing-foot" data-id="landing-foot">
          <a href="https://hoandat.com" data-id="landing-foot-hoandat"><T k="landing.fromHoandat" /></a>
          <LegalLinks dataId="landing-foot" />
        </footer>
      </main>
    </SkyScene>
  );
}
