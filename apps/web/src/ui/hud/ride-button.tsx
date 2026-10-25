// NEW SCREEN element (Master Plan §6) on the M3.2 HUD: "Lái xe" / "Xuống xe" for the vehicle the child
// equipped in the Character Creator. Shown only while one is equipped; the game puts her on it or off it
// (bridge command `ride`) and reports back (event `vehicle`), also when water puts her off on its own.
// Compact HUD (owner, 25/10/2026): "Lái xe" is a tile in the HUD menu; "Xuống xe" stands on screen, above the
// stick, only while she rides.
import { useGameState, useGameStore } from '../../game-bridge/use-game-state';
import { T, useT } from '../i18n/use-t';
import { Icon } from '../kit/art';
import { buttonClass } from '../kit/button';
import './ride-button.css';

export function RideButton({ place }: { place: 'screen' | 'menu' }) {
  const store = useGameStore();
  const vehicle = useGameState((s) => s.vehicle);
  const { name } = useT();
  if (!vehicle || vehicle.riding !== (place === 'screen')) return null;
  return (
    <button
      type="button"
      className={place === 'screen' ? 'hud-ride' : buttonClass('secondary', { small: true })}
      data-id="hud-ride"
      data-riding={vehicle.riding}
      aria-pressed={vehicle.riding}
      title={name(vehicle.name)}
      // On screen ("Xuống xe"), the label over a target keeps off it (the game reads its box).
      ref={
        place === 'screen'
          ? (el: HTMLButtonElement | null) => {
              store.setPromptAvoid('hud-ride', el);
              return () => store.setPromptAvoid('hud-ride', null);
            }
          : undefined
      }
      onClick={() => store.send({ type: 'ride', on: !vehicle.riding })}
    >
      <Icon name="automobile" size={place === 'screen' ? 36 : 28} />
      <T k={vehicle.riding ? 'hud.rideOff' : 'hud.rideOn'} />
    </button>
  );
}
