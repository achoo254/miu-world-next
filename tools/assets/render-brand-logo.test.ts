import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { MASTER_PATH, renderBrandLogos } from './render-brand-logo';

const master = PNG.sync.read(readFileSync(MASTER_PATH));
const logos = renderBrandLogos(master);
const logo = (file: string): PNG => {
  const found = logos.find((l) => l.file === file);
  if (!found) throw new Error(`missing ${file}`);
  return found.png;
};
const alphaAt = (png: PNG, x: number, y: number): number => png.data[(y * png.width + x) * 4 + 3] ?? -1;

describe('render-brand-logo', () => {
  it('derives every logo file from the committed master, at its size', () => {
    expect(logos.map((l) => [l.file, l.png.width, l.png.height, l.opaque])).toEqual([
      ['miu-logo-1024.png', 1024, 1024, true],
      ['miu-logo-512.png', 512, 512, true],
      ['miu-logo-192.png', 192, 192, true],
      ['miu-logo-180.png', 180, 180, true],
      ['miu-logo-120.png', 120, 120, true],
      ['miu-logo-32.png', 32, 32, true],
      ['miu-logo-maskable-512.png', 512, 512, true],
      ['miu-logo-adaptive-1024.png', 1024, 1024, true],
      ['miu-logo-monochrome-1024.png', 1024, 1024, false],
    ]);
    // The store icon is the master itself, pixel for pixel: nothing is drawn by code.
    expect(Buffer.compare(logo('miu-logo-1024.png').data, master.data)).toBe(0);
  });

  it('continues the sky around the inset art of the adaptive and maskable icons', () => {
    for (const file of ['miu-logo-adaptive-1024.png', 'miu-logo-maskable-512.png']) {
      const png = logo(file);
      const top = png.data.subarray(0, 3);
      const bottom = png.data.subarray((png.width * (png.height - 1)) * 4, (png.width * (png.height - 1)) * 4 + 3);
      // Sky blue at the top, pink at the bottom, like the master.
      expect(top[2] ?? 0).toBeGreaterThan(top[0] ?? 0);
      expect(bottom[0] ?? 0).toBeGreaterThan(bottom[1] ?? 0);
    }
  });

  it('cuts a single-colour silhouette of the head for themed icons, inside the adaptive safe circle', () => {
    const png = logo('miu-logo-monochrome-1024.png');
    const colours = new Set<string>();
    let opaque = 0;
    let outsideCircle = 0;
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const i = (y * png.width + x) * 4;
        if ((png.data[i + 3] ?? 0) === 0) continue;
        colours.add(`${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`);
        opaque++;
        if (Math.hypot(x + 0.5 - 512, y + 0.5 - 512) > 0.61 * 512) outsideCircle++;
      }
    }
    expect([...colours]).toEqual(['255,255,255']);
    expect(opaque / (1024 * 1024)).toBeGreaterThan(0.12);
    expect(outsideCircle).toBe(0);
    expect(alphaAt(png, 4, 4)).toBe(0);
    expect(alphaAt(png, 512, 440)).toBe(255);
  });
});
