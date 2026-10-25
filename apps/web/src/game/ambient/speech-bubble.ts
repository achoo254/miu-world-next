// A speech bubble over a villager or animal: a rounded white card with a tail, painted on a canvas
// and shown as a sprite (one draw call). It pops in, stays long enough to read, and fades out.
import { CanvasTexture, PerspectiveCamera, SRGBColorSpace, Sprite, SpriteMaterial, Vector2, Vector3 } from 'three';

const WIDTH = 512;
/** Room for the card, a second (English) line under the first in Song ngữ, and the tail. */
const HEIGHT = 192;
/** World size of the bubble (blocks). */
const WORLD_WIDTH = 2.8;
/** Seconds shown: reading time grows with the line, fading out over the last half second. */
const MIN_SECONDS = 2.4;
const PER_CHAR = 0.06;
const FADE = 0.5;
const POP = 0.18;
/**
 * Most of the screen a bubble may take: its card is kept at most this many CSS pixels wide, and at most this share
 * of the view's width, however close the speaker stands to the camera (a phone or tablet held near a bot otherwise
 * shows a bubble across half the screen).
 */
export const MAX_SCREEN_PX = 260;
export const MAX_SCREEN_SHARE = 0.38;

/**
 * How much to shrink a bubble `worldWidth` blocks wide, `distance` blocks from a perspective camera of vertical field
 * of view `fovDeg`, on a view `viewWidth` × `viewHeight` CSS pixels, so it stays within the caps above (1: no change).
 */
export function screenCap(worldWidth: number, distance: number, fovDeg: number, viewWidth: number, viewHeight: number): number {
  if (distance <= 0 || viewHeight <= 0) return 1;
  const pxPerBlock = viewHeight / (2 * distance * Math.tan((fovDeg * Math.PI) / 360));
  const px = worldWidth * pxPerBlock;
  const max = Math.min(MAX_SCREEN_PX, viewWidth * MAX_SCREEN_SHARE);
  return px > max ? max / px : 1;
}

const viewSize = new Vector2();
const spot = new Vector3();
const eye = new Vector3();

export interface SpeechBubble {
  readonly sprite: Sprite;
  /** `sub`: a smaller second line (the English one in Song ngữ). */
  show(text: string, sub?: string | null): void;
  hide(): void;
  update(dt: number): void;
  readonly showing: boolean;
}

/** --color-ink of the UI tokens (a canvas cannot read CSS variables). */
const INK = '#2b2140';

const MAIN_FONT = '700 44px "Baloo 2", "Nunito", sans-serif';
const SUB_FONT = '600 30px "Baloo 2", "Nunito", sans-serif';

function paint(ctx: CanvasRenderingContext2D, text: string, sub: string | null): void {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.font = SUB_FONT;
  const subWidth = sub ? ctx.measureText(sub).width : 0;
  ctx.font = MAIN_FONT;
  const textWidth = Math.min(WIDTH - 60, Math.max(ctx.measureText(text).width, subWidth));
  const w = textWidth + 56;
  const x = (WIDTH - w) / 2;
  const h = sub ? 130 : 96;
  ctx.fillStyle = 'rgba(43, 33, 64, 0.18)'; // soft drop shadow
  ctx.beginPath();
  ctx.roundRect(x + 4, 10, w, h, 34);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(x, 4, w, h, 34);
  ctx.moveTo(WIDTH / 2 - 16, 4 + h);
  ctx.lineTo(WIDTH / 2, 4 + h + 34);
  ctx.lineTo(WIDTH / 2 + 16, 4 + h);
  ctx.fill();
  ctx.stroke();
  // Cover the stroke where the tail meets the card.
  ctx.fillRect(WIDTH / 2 - 14, h - 2, 28, 8);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (!sub) {
    ctx.fillText(text, WIDTH / 2, 4 + h / 2 + 2, WIDTH - 60);
    return;
  }
  ctx.fillText(text, WIDTH / 2, 4 + 42, WIDTH - 60);
  ctx.font = SUB_FONT;
  ctx.fillText(sub, WIDTH / 2, 4 + 94, WIDTH - 60);
}

export function createSpeechBubble(): SpeechBubble {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  // Drawn over trees and fences: a line half hidden behind a trunk cannot be read.
  const material = new SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false, opacity: 0 });
  const sprite = new Sprite(material);
  sprite.center.set(0.5, 0);
  sprite.renderOrder = 10;
  sprite.visible = false;
  const base = WORLD_WIDTH;
  let left = 0;
  let total = 0;
  let popScale = base;
  // Just before it is drawn, fit the bubble to the screen it is seen on (the camera and view are only known then).
  sprite.onBeforeRender = (renderer, _scene, camera) => {
    let cap = 1;
    if (camera instanceof PerspectiveCamera) {
      renderer.getSize(viewSize);
      const distance = sprite.getWorldPosition(spot).distanceTo(camera.getWorldPosition(eye));
      cap = screenCap(popScale * worldScale(sprite), distance, camera.fov, viewSize.x, viewSize.y);
    }
    const scale = popScale * cap;
    sprite.scale.set(scale, (scale * HEIGHT) / WIDTH, 1);
    sprite.updateMatrixWorld();
  };
  const hide = (): void => {
    left = 0;
    sprite.visible = false;
    material.opacity = 0;
  };
  return {
    sprite,
    get showing() {
      return left > 0;
    },
    show(text, sub = null) {
      if (ctx) paint(ctx, text, sub);
      texture.needsUpdate = true;
      total = Math.max(MIN_SECONDS, (text.length + (sub?.length ?? 0)) * PER_CHAR);
      left = total;
      sprite.visible = true;
    },
    hide,
    update(dt) {
      if (left <= 0) return;
      left -= dt;
      const shown = total - left;
      const pop = Math.min(1, shown / POP);
      popScale = base * (0.7 + 0.3 * pop);
      sprite.scale.set(popScale, (popScale * HEIGHT) / WIDTH, 1);
      material.opacity = Math.min(pop, left / FADE, 1);
      if (left <= 0) hide();
    },
  };
}

/** How much the sprite's parents scale it (a bubble over a scaled character is that much bigger in the world). */
function worldScale(sprite: Sprite): number {
  const parent = sprite.parent;
  if (!parent) return 1;
  return parent.getWorldScale(spot).x;
}
