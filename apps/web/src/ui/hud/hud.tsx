// M3.2 HUD over the game, compact (owner, 25/10/2026: touch HUDs of block games as the model): a small player chip
// (avatar, level ring, coins from the server), the current quest as a one-line pill that opens into its card, ONE
// menu button holding Quests / Map / Backpack / Friends / pet / today's lesson / riding / Pause, and the contextual
// buttons ("Quay lại", "Xuống xe") only while they can be used. There is no Interact button: the label over the target
// in the world is tapped (play-screen.tsx), or E pressed. Nothing here changes per frame.
import { Link } from 'react-router';
import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { QuestSummary } from '@miu/schema/game';
import type { AutowalkState } from '../../game-bridge/game-store';
import { useGameState, useGameStore } from '../../game-bridge/use-game-state';
import { mapBoth, type TextKey } from '../i18n/i18n';
import { T, useT } from '../i18n/use-t';
import { Icon } from '../kit/art';
import { buttonClass } from '../kit/button';
import { PlayerBadge } from '../player/player-badge';
import { nextStep, say, stepProgress, type PlayerData } from '../player/player-data';
import { TopicLabel, topicOf } from '../player/topic-label';
import { Say, stepLineOf, titleOf } from '../quest/content-text';
import { searchCount } from '../quest/quest-flow';
import { HudMenu } from './hud-menu';
import { RideButton } from './ride-button';
import { useHudKeyboardGuard } from './use-hud-keyboard-guard';
import './hud.css';
import './autowalk.css';

/** What the quest card's walk line says in each state of the walk. */
const AUTOWALK_LINE: Record<AutowalkState, TextKey> = {
  idle: 'hud.autowalk.idle',
  finding: 'hud.autowalk.finding',
  walking: 'hud.autowalk.walking',
  arrived: 'hud.autowalk.arrived',
  failed: 'hud.autowalk.failed',
};

/**
 * An opened card folds itself away after this long without a touch (owner, 03/10/2026: "10–15 s"), counted from when
 * the map is up (owner, 07/10/2026): on a slow device the loading screen would otherwise eat most of it.
 */
export const TRACKER_FOLD_MS = 12_000;

/**
 * The quest card. It starts as a one-line pill (the quest's name and its steps done; owner, 25/10/2026) and opens on
 * a tap of it. Open, while the step's target stands on this map, tapping the card walks the character there along the
 * ways (the game finds the route), and tapping it again stops her. It folds back with its "Thu gọn" button, after
 * TRACKER_FOLD_MS untouched, or when the quest moves on to another step (the pill's count moves with it).
 */
export function QuestTracker({ quest, data }: { quest: QuestSummary | null; data: PlayerData }) {
  const store = useGameStore();
  const { t } = useT();
  const available = useGameState((s) => s.autowalkAvailable);
  const ready = useGameState((s) => s.status === 'ready');
  const autowalk = useGameState((s) => s.autowalk);
  const stepKey = quest ? `${quest.quest.id}:${nextStep(quest)?.id ?? 'done'}` : null;
  /** The step the card was opened at: open only while the quest is still on that step, so a new step folds it. */
  const [openAt, setOpenAt] = useState<string | null>(null);
  const folded = stepKey === null || openAt !== stepKey;
  const setFolded = (value: boolean): void => setOpenAt(value ? null : stepKey);
  /** Bumped by every touch on the card: restarts the countdown to folding. */
  const [touched, setTouched] = useState(0);
  useEffect(() => {
    if (folded || !stepKey || !ready) return;
    const timer = window.setTimeout(() => setOpenAt(null), TRACKER_FOLD_MS);
    return () => window.clearTimeout(timer);
  }, [folded, stepKey, touched, ready]);
  if (!quest) return null;
  const step = nextStep(quest);
  const { done, total } = stepProgress(quest);
  const clues = step ? searchCount(step, quest.progress) : null;
  const topic = topicOf(quest);
  const going = autowalk === 'finding' || autowalk === 'walking';
  const tappable = Boolean(step) && (available || going);
  const toggle = (): void => store.send({ type: going ? 'autowalk-stop' : 'autowalk-start' });
  if (folded) {
    return (
      <button
        type="button"
        className="hud-tracker-pill"
        data-id="hud-tracker-pill"
        // Its name holds what it shows (the quest and its steps done), then what a tap does.
        aria-label={t('hud.openQuest', { quest: mapBoth(titleOf(quest.quest), (line) => say(line, data.character)), done, total })}
        onClick={() => setFolded(false)}
      >
        <Icon name="scroll" size={24} />
        <span className="hud-tracker-pill-title" data-id="hud-tracker-pill-title">
          <Say text={titleOf(quest.quest)} fill={(line) => say(line, data.character)} />
        </span>
        <span className="hud-tracker-pill-count" data-id="hud-tracker-pill-count">
          {done}/{total}
        </span>
        {going ? <Icon name="runningShoe" size={20} /> : null}
      </button>
    );
  }
  const onKey = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggle();
  };
  return (
    <section
      className="hud-tracker"
      aria-label={t('hud.current')}
      data-id="hud-tracker"
      data-autowalk={tappable ? autowalk : undefined}
      onPointerDown={() => setTouched((n) => n + 1)}
      {...(tappable ? { role: 'button', tabIndex: 0, 'aria-pressed': going, onClick: toggle, onKeyDown: onKey } : {})}
    >
      <p className="hud-tracker-kicker">
        <Icon name="scroll" size={24} />
        <T k="hud.current" />
        <button
          type="button"
          className="hud-tracker-fold"
          data-id="hud-tracker-fold"
          aria-label={t('hud.fold')}
          onClick={(event) => {
            // Folding is not a tap on the card (that starts or stops the walk).
            event.stopPropagation();
            setFolded(true);
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          ▲
        </button>
      </p>
      <p className="hud-tracker-quest" data-id="hud-tracker-quest">
        <Say text={titleOf(quest.quest)} fill={(line) => say(line, data.character)} />
      </p>
      {topic ? <TopicLabel topic={topic} dataId="hud-tracker-topic" compact /> : null}
      <p className="hud-tracker-step" data-id="hud-tracker-step">
        {/* Where to walk while the step waits somewhere else; its title heads the scene once there. */}
        {step ? <Say text={stepLineOf(step)} fill={(line) => say(line, data.character)} /> : <T k="hud.done" />}
        {clues ? (
          <span className="hud-tracker-count" data-id="hud-tracker-count">
            {' '}
            {clues.found}/{clues.total}
          </span>
        ) : null}
      </p>
      <p className="hint" data-id="hud-tracker-progress">
        {done}/{total}
      </p>
      {tappable || autowalk === 'arrived' || autowalk === 'failed' ? (
        <p className="hud-autowalk" data-id="hud-autowalk" data-state={autowalk} aria-live="polite">
          <Icon name={autowalk === 'arrived' ? 'glowingStar' : autowalk === 'failed' ? 'map' : 'runningShoe'} size={20} />
          <T k={AUTOWALK_LINE[autowalk]} />
        </p>
      ) : null}
    </section>
  );
}

/** Only while Miu is stuck (water, or the stick gets her nowhere): puts her back where she last stood safely. */
function RescueButton() {
  const store = useGameStore();
  const stuck = useGameState((s) => s.stuck);
  if (!stuck) return null;
  return (
    <button
      type="button"
      className="hud-rescue"
      data-id="hud-rescue"
      // The label over a target keeps off it (the game reads its box).
      ref={(el) => {
        store.setPromptAvoid('hud-rescue', el);
        return () => store.setPromptAvoid('hud-rescue', null);
      }}
      onClick={() => store.send({ type: 'rescue' })}
    >
      <Icon name="ringBuoy" size={36} />
      <T k="hud.rescue" />
    </button>
  );
}

export function Hud({
  data,
  quest,
  covered = false,
  onMenu,
  onQuests,
  onBackpack,
  menu,
  menuBadge = 0,
  menuFresh = false,
  children,
}: {
  data: PlayerData;
  quest: QuestSummary | null;
  /** A screen covers the game: the whole HUD steps aside, so nothing of it shows through or under that screen. */
  covered?: boolean;
  /** Opens Pause, with the settings. */
  onMenu: () => void;
  /** Opens this map's quest board over the game: every quest can be taken from there. */
  onQuests: () => void;
  onBackpack: () => void;
  /** More actions in the menu's grid after Quests / Map / Backpack (friends, the pet, today's lesson). */
  menu?: ReactNode;
  /** Things waiting inside the menu (friend requests): the number on its button. */
  menuBadge?: number;
  /** Something new inside the menu without a number (today's lesson): a dot on its button. */
  menuFresh?: boolean;
  /** More of the left column under the quest card (the online party frame, contextual buttons). */
  children?: ReactNode;
}) {
  const store = useGameStore();
  useHudKeyboardGuard();
  if (covered) return null;
  // The label over a target in the world keeps off these panels (the game reads their boxes).
  const avoid = (key: string) => (el: HTMLElement | null) => {
    store.setPromptAvoid(key, el);
    return () => store.setPromptAvoid(key, null);
  };
  return (
    <>
      <div className="hud-top-left" ref={avoid('hud-left')}>
        <PlayerBadge character={data.character} progress={data.progress} compact />
        <QuestTracker quest={quest} data={data} />
        {children}
      </div>
      <HudMenu badge={menuBadge} fresh={menuFresh} onAvoid={(key, el) => store.setPromptAvoid(key, el)}>
        <button type="button" className={buttonClass('secondary', { small: true })} data-id="hud-quests" onClick={onQuests}>
          <Icon name="scroll" size={28} />
          <T k="common.quests" />
        </button>
        <Link to="/map" className={buttonClass('secondary', { small: true })} data-id="hud-map">
          <Icon name="map" size={28} />
          <T k="common.map" />
        </Link>
        <button type="button" className={buttonClass('secondary', { small: true })} data-id="hud-backpack" onClick={onBackpack}>
          <Icon name="backpack" size={28} />
          <T k="common.backpack" />
        </button>
        {menu}
        <RideButton place="menu" />
        <button type="button" className={buttonClass('primary', { small: true })} data-id="hud-menu" onClick={onMenu}>
          <Icon name="gear" size={28} />
          <T k="hud.settings" />
        </button>
      </HudMenu>
      <RescueButton />
      <RideButton place="screen" />
    </>
  );
}
