import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASSETS_DIR, REPO_ROOT } from './asset-lib';
import { listMasters, uiArtOutput, uiArtSize } from './build-ui-art';

const regions = (JSON.parse(readFileSync(path.join(REPO_ROOT, 'content/world/regions.json'), 'utf8')) as { regions: Array<{ id: string; backdrop?: unknown }> }).regions;
const manifest = JSON.parse(readFileSync(path.join(ASSETS_DIR, 'manifest.json'), 'utf8')) as { generated: Array<{ path: string; license: string }> };

describe('build-ui-art', () => {
  it('has a master for the island and for every region screen with a backdrop', async () => {
    const masters = await listMasters();
    expect(masters).toContain('home-island.png');
    for (const region of regions.filter((r) => r.backdrop)) expect(masters).toContain(`region-${region.id}.png`);
  });

  it('sizes the island at the 16:10 stage and the backdrops at 1440 × 900, and refuses a master it has no size for', () => {
    expect(uiArtSize('home-island.png')).toEqual({ width: 1600, height: 1000 });
    expect(uiArtSize('region-lau-dai.png')).toEqual({ width: 1440, height: 900 });
    expect(() => uiArtSize('poster.png')).toThrow(/no screen size/);
  });

  it('lists every derived picture in the manifest under the hoandat licence', async () => {
    const entries = new Map(manifest.generated.map((g) => [g.path, g.license]));
    for (const master of await listMasters()) expect(entries.get(uiArtOutput(master))).toBe('LicenseRef-hoandat-all-rights-reserved');
  });
});
