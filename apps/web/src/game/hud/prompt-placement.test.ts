import { describe, expect, it } from 'vitest';
import { HEAD_GAP, PANEL_GAP, promptClearOf, promptClearOfPanels } from './prompt-placement';

// Her on screen: a figure 100 px wide from y 400 (ears) to 600 (feet), in the middle of an iPad.
const her = { left: 360, right: 460, top: 400, bottom: 600 };
const label = { width: 140, height: 32 };

describe('the Interact label and her head', () => {
  it('lifts a label resting on her head (a target just behind her) clear above it', () => {
    expect(promptClearOf({ x: 410, y: 402 }, label, her)).toEqual({ x: 410, y: 400 - HEAD_GAP });
    expect(promptClearOf({ x: 410, y: 520 }, label, her)).toEqual({ x: 410, y: 400 - HEAD_GAP });
  });

  it('leaves a label that is already clear of her: above, beside, or wholly under her', () => {
    expect(promptClearOf({ x: 410, y: 300 }, label, her)).toEqual({ x: 410, y: 300 });
    expect(promptClearOf({ x: 600, y: 450 }, label, her)).toEqual({ x: 600, y: 450 });
    expect(promptClearOf({ x: 410, y: 700 }, label, her)).toEqual({ x: 410, y: 700 });
  });
});

describe('the Interact label and the HUD panels', () => {
  const view = { width: 820, height: 1180 };
  const panel = { left: 0, right: 300, top: 0, bottom: 400 };

  it('leaves a label clear of every panel where it is', () => {
    expect(promptClearOfPanels({ x: 500, y: 600 }, label, [panel], view)).toEqual({ x: 500, y: 600 });
  });

  it('moves a label resting on a panel to the nearest clear spot, never hiding it', () => {
    // Resting on the panel's bottom edge: just under it.
    expect(promptClearOfPanels({ x: 150, y: 410 }, label, [panel], view)).toEqual({ x: 150, y: 400 + PANEL_GAP + label.height });
    // Near the panel's right edge: just right of it.
    expect(promptClearOfPanels({ x: 290, y: 200 }, label, [panel], view)).toEqual({ x: 300 + PANEL_GAP + label.width / 2, y: 200 });
  });

  it('keeps the label on screen, and counts an empty (closed) panel for nothing', () => {
    expect(promptClearOfPanels({ x: 5, y: 5 }, label, [{ left: 0, right: 0, top: 0, bottom: 0 }], view)).toEqual({ x: label.width / 2 + PANEL_GAP, y: label.height + PANEL_GAP });
  });
});
