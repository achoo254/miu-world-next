import { describe, expect, it } from 'vitest';
import { MAX_SCREEN_PX, MAX_SCREEN_SHARE, screenCap } from './speech-bubble';

/** On-screen width (CSS px) of a bubble `w` blocks wide at `d` blocks, after the cap. */
const shown = (w: number, d: number, fov: number, vw: number, vh: number): number =>
  (w * screenCap(w, d, fov, vw, vh) * vh) / (2 * d * Math.tan((fov * Math.PI) / 360));

describe('speech bubble screen cap', () => {
  it('leaves a bubble seen from afar as it is', () => {
    expect(screenCap(2.8, 30, 55, 1280, 800)).toBe(1);
  });

  it('keeps a bubble right in front of the camera within the pixel cap on a tablet', () => {
    expect(shown(2.8, 3, 55, 1180, 820)).toBeCloseTo(MAX_SCREEN_PX, 5);
  });

  it('keeps it within its share of a phone screen held upright', () => {
    expect(shown(2.8, 2, 55, 360, 740)).toBeCloseTo(360 * MAX_SCREEN_SHARE, 5);
  });

  it('does nothing for a camera at the bubble or a view of no height', () => {
    expect(screenCap(2.8, 0, 55, 360, 740)).toBe(1);
    expect(screenCap(2.8, 3, 55, 360, 0)).toBe(1);
  });
});
