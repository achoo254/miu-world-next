// The "Đi tới" / "Đi đến" button under something not hers yet (a trophy room piece, a collection book thing): it names
// the map where it is earned and hands the trip to the play screen, which walks her there on this map or takes her
// beside it on another (play-screen.tsx `goThere`). Navigation only; what she earns stays the server's.
import { fillPlayerName } from '@miu/quest/player-name';
import type { QuestSummary } from '@miu/schema/game';
import { mapBoth, type TextKey } from '../i18n/i18n';
import { nameOf } from '../i18n/names';
import { T, useT } from '../i18n/use-t';
import { buttonClass } from '../kit/button';
import { findRegion, regionMap } from '../region/regions';
import type { PlaceTrip } from './place-trips';
import './travel.css';

/** What a screen opened over the game needs to send her somewhere: where she is, her list, and the play screen's go. */
export interface Travel {
  /** The region she is on now: a place on its map is walked to, any other is travelled to. */
  region: string;
  /** Her character's name, for a map named after her (her home). */
  name: string;
  /** Her quest list (`GET /quests`). */
  quests: readonly QuestSummary[];
  onGo: (trip: PlaceTrip) => void;
}

/** Nothing when no place leads to it now. `label`: the button's word on that screen, also the start of its name. */
export function GoThereButton({ trip, travel, dataId, label }: { trip: PlaceTrip | null; travel: Travel; dataId: string; label: TextKey }) {
  const { t } = useT();
  if (!trip) return null;
  const map = mapBoth(nameOf(findRegion(trip.region)?.name ?? trip.region), (text) => fillPlayerName(text, travel.name));
  const here = regionMap(trip.region) === regionMap(travel.region);
  return (
    <span className="go-there">
      <button type="button" className={buttonClass('secondary', { small: true })} data-id={dataId} aria-label={t(here ? 'travel.goHereAria' : 'travel.goAria', { word: t(label), map })} onClick={() => travel.onGo(trip)}>
        <T k={label} />
      </button>
      <span className="go-there-where" data-id={`${dataId}-where`}>
        {here ? <T k="travel.here" /> : <T k="travel.where" params={{ map }} />}
      </span>
    </span>
  );
}
