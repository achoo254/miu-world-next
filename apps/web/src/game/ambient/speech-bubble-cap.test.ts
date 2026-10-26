import { PerspectiveCamera } from 'three';
import { describe, expect, it } from 'vitest';
import { MAX_SCREEN_PX, MAX_SCREEN_SHARE, createSpeechBubble, screenCap } from './speech-bubble';

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

describe('speech bubble on screen', () => {
  const view = { width: 800, height: 600 };
  const camera = (): PerspectiveCamera => {
    const cam = new PerspectiveCamera(60, view.width / view.height, 0.1, 100);
    cam.position.set(0, 0, 10);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    return cam;
  };

  it('has no box until it shows, and none once it has faded out', () => {
    const bubble = createSpeechBubble();
    expect(bubble.screenBox(camera(), view)).toBeNull();
    bubble.show('Chào!');
    bubble.update(0.5);
    expect(bubble.screenBox(camera(), view)).not.toBeNull();
    bubble.update(10);
    expect(bubble.screenBox(camera(), view)).toBeNull();
  });

  it('stands on its foot, centred over the speaker, as wide and tall as it is drawn', () => {
    const bubble = createSpeechBubble();
    bubble.show('Chào!');
    bubble.update(0.5);
    bubble.sprite.updateMatrixWorld();
    const box = bubble.screenBox(camera(), view);
    if (!box) throw new Error('no box');
    // Its foot at the middle of the view (the speaker at the origin).
    expect((box.left + box.right) / 2).toBeCloseTo(view.width / 2, 5);
    expect(box.bottom).toBeCloseTo(view.height / 2, 5);
    const pxPerBlock = view.height / (2 * 10 * Math.tan(Math.PI / 6));
    expect(box.right - box.left).toBeCloseTo(bubble.sprite.scale.x * pxPerBlock, 5);
    expect(box.bottom - box.top).toBeCloseTo(bubble.sprite.scale.y * pxPerBlock, 5);
  });

  it('has no box behind the camera', () => {
    const bubble = createSpeechBubble();
    bubble.show('Chào!');
    bubble.update(0.5);
    bubble.sprite.position.set(0, 0, 20);
    bubble.sprite.updateMatrixWorld();
    expect(bubble.screenBox(camera(), view)).toBeNull();
  });
});
