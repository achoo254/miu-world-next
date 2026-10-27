// NEW SCREEN (Master Plan §6, account area): the account owner looks after every player of the account. One card
// per player, opened to her learning progress, her online switches (companion bots; voice chat and online play, which
// only the owner turns off and the server enforces), or her friends and blocks (view, remove, unblock; she answers
// requests herself). Everything is read from the server for that player
// (`/api/players/:id/…`). Turning voice chat on for an extra player needs the account owner to sign in again (Google or
// Apple); the server answers `reauth-required` until then, and the card offers that sign-in under the switch.
import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { PlayerOwnerSettings, type PlayerDto, type PlayerOwnerSettingsPatch } from '@miu/schema/account';
import { ApiError, api } from '../api-client';
import type { TextKey } from '../i18n/i18n';
import { T, useT } from '../i18n/use-t';
import { Icon, MiuArt } from '../kit/art';
import { buttonClass } from '../kit/button';
import { Tabs, type TabItem } from '../kit/tabs';
import { accountSocial } from '../friends/friends-api';
import { FriendsPanel } from '../friends/friends-panel';
import { PlayerProgress } from '../profile/progress-panel';
import { IdpSignInButton, signInErrorKey } from './idp-sign-in-button';
import { tileClass } from './profile-screens';
import { useSubmit } from './use-submit';
import '../system/settings.css';
import './account-players.css';

type CareTab = 'progress' | 'online' | 'friends';

/**
 * The account owner's switches for a player, applied at once even in a room: her companion bots (her own setting
 * too), and voice chat and online play, which only the owner changes (the server refuses them to the player herself).
 * Online play is on by default; voice chat too for the primary player, but off for an extra player until the owner
 * confirms by signing in again.
 */
function PlayerOnlineSwitches({ player }: { player: PlayerDto }) {
  const [settings, setSettings] = useState<PlayerOwnerSettings>({ botsEnabled: player.botsEnabled, voiceChatAllowed: player.voiceChatAllowed, onlineAllowed: player.onlineAllowed });
  /** The server asked for a fresh sign-in before voice chat turns on (extra players only). */
  const [needsReauth, setNeedsReauth] = useState(false);
  /** The change being saved (the submit wrapper takes no arguments). */
  const pending = useRef<PlayerOwnerSettingsPatch>({});
  const save = useSubmit(async () => {
    try {
      setSettings(await api('PATCH', `/players/${player.id}/settings`, PlayerOwnerSettings, pending.current));
      setNeedsReauth(false);
    } catch (err) {
      // Not an error to show: the sign-in under the switch is the way on.
      if (err instanceof ApiError && err.code === 'reauth-required') setNeedsReauth(true);
      else throw err;
    }
  });
  const change = (patch: PlayerOwnerSettingsPatch): void => {
    pending.current = patch;
    void save.onSubmit();
  };
  const choice = (key: keyof PlayerOwnerSettings, title: TextKey, hint?: TextKey) => (
    <div className="setting-group" role="radiogroup" aria-labelledby={`player-care-${key}-${player.id}`} data-id={`player-care-${key}-${player.id}`}>
      <p className="setting-title" id={`player-care-${key}-${player.id}`}>
        <T k={title} />
      </p>
      {hint ? (
        <p className="hint setting-hint">
          <T k={hint} />
        </p>
      ) : null}
      <div className="setting-choices">
        {[true, false].map((on) => (
          <button
            key={String(on)}
            type="button"
            role="radio"
            aria-checked={settings[key] === on}
            className="setting-choice"
            data-id={`player-care-${key}-${player.id}-${on ? 'on' : 'off'}`}
            disabled={save.busy}
            onClick={() => change({ [key]: on })}
          >
            <T k={on ? 'settings.switchOn' : 'settings.switchOff'} />
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="player-care-switches">
      <p className="hint">
        <T k="playerCare.settingsHint" />
      </p>
      {choice('onlineAllowed', 'playerCare.online', 'playerCare.onlineHint')}
      {choice('voiceChatAllowed', 'playerCare.voiceChat', player.primary ? 'playerCare.voiceChatHint' : 'playerCare.voiceChatHintExtra')}
      {needsReauth ? (
        <div className="setting-group" data-id={`player-care-voice-reauth-${player.id}`}>
          <p className="hint" role="status">
            <T k="playerCare.voiceReauth" />
          </p>
          {/* In the app the sign-in finishes here, so voice chat turns on straight after; the web comes back to this page. */}
          <IdpSignInButton dataId={`player-care-voice-reauth-${player.id}-sign-in`} reauth label={<T k="playerCare.voiceReauthButton" />} onSignedIn={() => change({ voiceChatAllowed: true })} />
        </div>
      ) : null}
      {choice('botsEnabled', 'settings.bots')}
      {save.error ? (
        <p role="alert" className="error">
          {save.error}
        </p>
      ) : null}
    </div>
  );
}

function PlayerCareCard({ player, index }: { player: PlayerDto; index: number }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<CareTab>('progress');
  const tabs: TabItem<CareTab>[] = [
    { key: 'progress', label: <T k="progress.title" /> },
    { key: 'online', label: <T k="settings.groupOnline" /> },
    { key: 'friends', label: <T k="friends.title" /> },
  ];
  // One source per player, so the list does not load again on every render.
  const friends = useMemo(() => accountSocial(player.id), [player.id]);
  return (
    <li className="player-care" data-id={`player-care-${player.id}`}>
      <div className="player-care-head">
        <span className={tileClass(index)}>
          <MiuArt pose="idle" species={player.species} />
        </span>
        <p className="player-care-name">{player.displayName}</p>
        <button
          type="button"
          className={buttonClass(open ? 'ghost' : 'secondary', { small: true })}
          data-id={`player-care-toggle-${player.id}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <T k={open ? 'playerCare.hide' : 'playerCare.show'} />
        </button>
      </div>
      {open ? (
        <Tabs label={t('playerCare.tabsLabel', { who: { vi: player.displayName, en: player.displayName } })} items={tabs} active={tab} onChange={setTab} dataId={`player-care-tabs-${player.id}`}>
          {tab === 'progress' ? <PlayerProgress playerId={player.id} /> : null}
          {tab === 'online' ? <PlayerOnlineSwitches player={player} /> : null}
          {tab === 'friends' ? (
            <>
              <p className="hint">
                <T k="friends.ownerNote" />
              </p>
              <FriendsPanel source={friends} dataId={`player-friends-${player.id}`} />
            </>
          ) : null}
        </Tabs>
      ) : null}
    </li>
  );
}

export function AccountPlayersPanel({ players }: { players: readonly PlayerDto[] }) {
  // A re-authentication asked for under a voice switch that did not go through comes back here with its reason.
  const [params] = useSearchParams();
  const reauthError = params.get('reauth-error');
  if (players.length === 0) return null;
  return (
    <section className="panel" data-id="player-care" aria-labelledby="player-care-title">
      <div className="panel-title">
        <Icon name="books" size={40} />
        <h2 id="player-care-title">
          <T k="playerCare.title" />
        </h2>
      </div>
      <p className="hint">
        <T k="playerCare.hint" />
      </p>
      {reauthError ? (
        <p role="alert" className="error" data-id="player-care-reauth-error">
          <T k={signInErrorKey(reauthError)} />
        </p>
      ) : null}
      <ul className="player-care-list">
        {players.map((player, i) => (
          <PlayerCareCard key={player.id} player={player} index={i} />
        ))}
      </ul>
    </section>
  );
}
