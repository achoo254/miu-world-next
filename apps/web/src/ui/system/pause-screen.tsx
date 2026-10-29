// NEW SCREEN (Master Plan §6 MVP): the in-game menu (once "Tạm dừng"), after the mock "Pause Menu"
// (designs/pause-settings-loading.png, ô 1), hướng A. It no longer stops the game (owner, 29/10/2026: the game is
// online, the world always lives): the world runs on behind it, only her own controls wait. Items: back to the game,
// sound on/off, language and read-aloud speed (Master Plan §8c), back to a safe spot (a stuck Miu), the Journey and
// the Achievements, change character (progress is kept), back home;
// Backpack and full Settings come with their own screens.
// Wide on tablets and computers (owner, 25/10/2026: a tall thin dialog there): the settings in two columns and the
// actions in a grid; one column on phones.
import { Link } from 'react-router';
import { Icon } from '../kit/art';
import { buttonClass } from '../kit/button';
import { Modal } from '../kit/modal';
import { T } from '../i18n/use-t';
import { FullSettingsGroups } from './full-settings';
import './pause-screen.css';

export function PauseScreen({ onResume, onRescue, homePath }: { onResume: () => void; onRescue: () => void; homePath: string }) {
  return (
    <Modal title={<T k="pause.title" />} onClose={onResume} dataId="pause" size="wide" className="pause-modal">
      <div className="modal-actions pause-body">
        <button type="button" className={buttonClass('primary', { block: true })} data-id="pause-resume" onClick={onResume}>
          <Icon name="glowingStar" size={32} />
          <T k="pause.resume" />
        </button>

        <FullSettingsGroups prefix="pause" />

        <div className="pause-actions">
          <button type="button" className={buttonClass('secondary', { block: true })} data-id="pause-rescue" onClick={onRescue}>
            <Icon name="ringBuoy" size={32} />
            <T k="pause.rescue" />
          </button>
          <Link to="/journey" className={buttonClass('secondary', { block: true })} data-id="pause-journey">
            <Icon name="map" size={32} />
            <T k="home.journey" />
          </Link>
          <Link to="/achievements" className={buttonClass('secondary', { block: true })} data-id="pause-achievements">
            <Icon name="trophy" size={32} />
            <T k="home.achievements" />
          </Link>
          <Link to="/create" className={buttonClass('secondary', { block: true })} data-id="pause-character">
            <Icon name="catFace" size={32} />
            <T k="settings.changeCharacter" />
          </Link>
          <Link to={homePath} className={buttonClass('ghost', { block: true })} data-id="pause-home">
            <Icon name="house" size={32} />
            <T k="common.backHome" />
          </Link>
        </div>
      </div>
    </Modal>
  );
}
