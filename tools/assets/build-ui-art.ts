// Derives the 2D menu art from its masters in designs/ui-art/: the Home and world-map island picture and one backdrop
// per region screen, painted on the owner's PC with FLUX.2 klein 4B (inet-artgen `klein-edit`, each repainted from the
// matching code render, generated/home/world.png or generated/regions/<id>.png, so the islands and the regions' scenes
// keep their places). AI-generated for the hoandat ecosystem; owned by hoandat, all rights reserved (not CC0) — the
// licence the asset gate accepts only for files matching `brandArt.globs`. Nothing is drawn here: each master is scaled
// to its screen size and encoded as WebP by libwebp's `cwebp` (on PATH, or the `CWEBP` variable), single-threaded with
// no metadata, so the same master and cwebp version give the same bytes.
// Output: assets/generated/ui-art/<master name>.webp. Re-run `pnpm assets:ui-art` after changing a master.
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { ASSETS_DIR, REPO_ROOT } from './asset-lib';
import { writeManifest } from './build-manifest';

export const MASTER_DIR = path.join(REPO_ROOT, 'designs/ui-art');
export const UI_ART_DIR = 'generated/ui-art';
/** WebP quality: the inet-artgen convention for art in a repo. */
const QUALITY = 88;

/** The size each master is shown at: the island stage is 16:10 at 1600 × 1000 (the landing page's <img> says so), a region backdrop 1440 × 900. */
export function uiArtSize(master: string): { width: number; height: number } {
  if (master === 'home-island.png') return { width: 1600, height: 1000 };
  if (/^region-[a-z0-9-]+\.png$/.test(master)) return { width: 1440, height: 900 };
  throw new Error(`designs/ui-art/${master}: no screen size for this master (expected home-island.png or region-<id>.png)`);
}

/** Manifest path of the WebP derived from a master. */
export const uiArtOutput = (master: string): string => `${UI_ART_DIR}/${path.basename(master, '.png')}.webp`;

/** The masters, sorted; anything but PNG in the folder is a mistake. */
export async function listMasters(): Promise<string[]> {
  const files = (await readdir(MASTER_DIR)).sort();
  const stray = files.filter((f) => !f.endsWith('.png'));
  if (stray.length > 0) throw new Error(`designs/ui-art holds non-PNG files: ${stray.join(', ')}`);
  return files;
}

async function encode(master: string, out: string): Promise<void> {
  const header = await readFile(path.join(MASTER_DIR, master));
  if (header.subarray(1, 4).toString('latin1') !== 'PNG') throw new Error(`designs/ui-art/${master} is not a PNG`);
  const { width, height } = uiArtSize(master);
  const cwebp = process.env.CWEBP ?? 'cwebp';
  const args = ['-quiet', '-q', String(QUALITY), '-m', '6', '-metadata', 'none', '-resize', String(width), String(height), path.join(MASTER_DIR, master), '-o', out];
  try {
    await promisify(execFile)(cwebp, args);
  } catch (error) {
    throw new Error(`cwebp failed for ${master} (install libwebp or set CWEBP): ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

async function main(): Promise<void> {
  const masters = await listMasters();
  const outDir = path.join(ASSETS_DIR, UI_ART_DIR);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  for (const master of masters) await encode(master, path.join(ASSETS_DIR, uiArtOutput(master)));
  console.log(`build-ui-art: ${masters.length} images in ${path.relative(process.cwd(), outDir)}`);
  await writeManifest();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
