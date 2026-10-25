// M1.1 / M3.2 top-left: avatar, character name, level with the XP bar, coins. Numbers are the
// server's (`GET /api/progress`); diamonds are not shown in the MVP (Master Plan §15 #6).
// `compact` (the game's HUD, owner 25/10/2026): the avatar in a ring filled by the XP of the level, the level on a tag
// under it, and the coins; the name and XP stay readable to screen readers.
import type { CSSProperties } from 'react';
import type { CharacterDto, ProgressResponse } from '@miu/schema/game';
import { T, useT } from '../i18n/use-t';
import { Icon, MiuPortrait } from '../kit/art';
import { ProgressBar } from '../kit/progress-bar';
import './player.css';

export function PlayerBadge({ character, progress, compact = false }: { character: CharacterDto; progress: ProgressResponse; compact?: boolean }) {
  const next = progress.xpForNextLevel;
  const { t } = useT();
  const coins = (
    <p className="player-coins" data-id="player-coins">
      <Icon name="coin" size={compact ? 24 : 32} label={t('common.coins')} />
      {progress.coins}
    </p>
  );
  if (compact) {
    const share = next === null ? 100 : Math.round((100 * Math.min(progress.xpIntoLevel, next)) / Math.max(next, 1));
    return (
      <div className="player-badge player-badge--compact" data-id="player-badge">
        <span className="player-badge-ring" style={{ '--xp': `${share}%` } as CSSProperties} role="img" aria-label={next === null ? t('player.maxLevel') : t('player.xpLabel', { done: progress.xpIntoLevel, total: next })}>
          <MiuPortrait pose="idle" size="2.75rem" species={character.species} />
          <span className="player-badge-level-tag" data-id="player-level">
            Lv.{progress.level}
          </span>
        </span>
        <span className="visually-hidden" data-id="player-name">
          {character.name}
        </span>
        {next === null ? null : (
          <span className="visually-hidden" data-id="player-xp">
            {progress.xpIntoLevel}/{next} XP
          </span>
        )}
        {coins}
      </div>
    );
  }
  return (
    <div className="player-badge" data-id="player-badge">
      <MiuPortrait pose="idle" size="4rem" species={character.species} />
      <div className="player-badge-text">
        <p className="player-badge-name" data-id="player-name">
          {character.name}
        </p>
        <p className="player-badge-level">
          <span data-id="player-level">Lv.{progress.level}</span>
          {next === null ? (
            <span className="hint">
              <T k="player.maxLevel" />
            </span>
          ) : (
            <span className="player-badge-xp">
              <ProgressBar done={progress.xpIntoLevel} total={next} label={t('player.xpLabel', { done: progress.xpIntoLevel, total: next })} />
              <span className="hint" data-id="player-xp">
                {progress.xpIntoLevel}/{next} XP
              </span>
            </span>
          )}
        </p>
      </div>
      {coins}
    </div>
  );
}
