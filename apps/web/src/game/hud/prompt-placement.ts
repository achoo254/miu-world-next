// Where the Interact label goes on screen: over its target, but never resting on the child's own head nor on a HUD
// panel. A target just behind her (a parrot at her shoulder) puts its label right on top of her, where it reads as
// her own; the label then moves straight up until it clears her head. Never hidden: it is how she interacts by touch.

/** A box on screen, in pixels from the top left. */
export interface ScreenBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Pixels kept between the label and her head. */
export const HEAD_GAP = 12;

/**
 * The label's bottom centre: `at` as it is when the label (`width` × `height`) keeps clear of `her`, else straight
 * above her head with `gap` to spare. A label wholly under her (a target in front, lower down) stays where it is.
 */
export function promptClearOf(at: { x: number; y: number }, label: { width: number; height: number }, her: ScreenBox, gap = HEAD_GAP): { x: number; y: number } {
  const left = at.x - label.width / 2;
  const right = at.x + label.width / 2;
  if (right <= her.left || left >= her.right) return at;
  if (at.y - label.height >= her.bottom) return at;
  if (at.y <= her.top - gap) return at;
  return { x: at.x, y: her.top - gap };
}

/** Pixels kept between the label and a HUD panel or the screen's edge. */
export const PANEL_GAP = 8;

/** Whether two boxes cross. */
const crosses = (a: ScreenBox, b: ScreenBox): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/**
 * The label's bottom centre kept on screen and off every HUD panel (`panels`; an empty box counts for none). The label
 * is the way to interact by touch, so it is never hidden for a panel: resting on one, it moves to the nearest spot
 * clear of all of them (under, over, left or right of the panel it rests on); none clear (a screen full of panels),
 * it stays where it was put.
 */
export function promptClearOfPanels(at: { x: number; y: number }, label: { width: number; height: number }, panels: readonly ScreenBox[], view: { width: number; height: number }, gap = PANEL_GAP): { x: number; y: number } {
  const halfW = label.width / 2;
  const clamp = (p: { x: number; y: number }): { x: number; y: number } => ({
    x: Math.min(Math.max(p.x, halfW + gap), Math.max(halfW + gap, view.width - halfW - gap)),
    y: Math.min(Math.max(p.y, label.height + gap), Math.max(label.height + gap, view.height - gap)),
  });
  const boxOf = (p: { x: number; y: number }): ScreenBox => ({ left: p.x - halfW, right: p.x + halfW, top: p.y - label.height, bottom: p.y });
  const solid = panels.filter((b) => b.right > b.left && b.bottom > b.top);
  const clear = (p: { x: number; y: number }): boolean => solid.every((b) => !crosses(boxOf(p), b));
  const start = clamp(at);
  if (clear(start)) return start;
  const candidates = solid
    .filter((b) => crosses(boxOf(start), b))
    .flatMap((b) => [
      { x: start.x, y: b.bottom + gap + label.height },
      { x: start.x, y: b.top - gap },
      { x: b.left - gap - halfW, y: start.y },
      { x: b.right + gap + halfW, y: start.y },
    ])
    .map(clamp)
    .filter(clear)
    .sort((a, b) => Math.hypot(a.x - start.x, a.y - start.y) - Math.hypot(b.x - start.x, b.y - start.y));
  return candidates[0] ?? start;
}
