// Derives every Miu World logo file from ONE master picture: designs/brand/miu-logo-master-1024.png, Miu's voxel cat
// head on the sky gradient, full-bleed square (AI-generated with OpenAI gpt-image for the hoandat ecosystem; owned by
// hoandat, all rights reserved, not CC0 — the licence the asset gate accepts only for generated/brand/). Nothing is
// drawn here, so re-running cannot bring back an older logo. Output in assets/generated/brand/:
// - miu-logo-<size>.png, the master scaled down, for the iPhone/Android apps' store icon (1024), Google's OAuth consent
//   screen (120), the favicon (32), the iPhone home screen (180) and the installed web app (192, 512);
// - miu-logo-maskable-512.png, the master at 80% inside the maskable safe zone, for the installed web app on Android;
// - miu-logo-adaptive-1024.png, the master at 60% (inside the 66 dp circle of the 108 dp layer every launcher shape
//   keeps), the Android app's adaptive foreground. Around the inset art the sky goes on from the art's own edges;
// - miu-logo-monochrome-1024.png, the cat head's white silhouette on transparent at the adaptive place and size (eyes and
//   mouth cut out), for Android 13's themed icons.
// Re-run `pnpm assets:logo`; apps/web/vite-app-icons.ts links them into the pages, apps/mobile/scripts/native-icons.ts
// into the apps.
import path from 'node:path';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import { ASSETS_DIR, REPO_ROOT } from './asset-lib';
import { writeManifest } from './build-manifest';

export const MASTER_PATH = path.join(REPO_ROOT, 'designs/brand/miu-logo-master-1024.png');
const OUT_DIR = path.join(ASSETS_DIR, 'generated/brand');
const MASTER = 1024;
/** The art's share of the side in the maskable icon: inside the 40%-radius circle Android may crop to. */
const MASKABLE_SCALE = 0.8;
/** The art's share of the 108 dp adaptive layer: inside the 66 dp circle a launcher keeps. */
const ADAPTIVE_SCALE = 0.6;
/** Columns at each side of the inset art averaged into the sky colour that continues around it. */
const EDGE_COLUMNS = 12;
/** Width of the soft blend between the inset art and the continued sky, as a share of the art's side. */
const FEATHER = 0.06;
/** How far (RGB distance) a pixel must be from its row's sky colour to count as the cat: the sky varies by under 8, the white head sits about 30 off the pink sky. */
const SKY_DISTANCE = 16;
/** Dark pixels (luma below this) inside the head are the eyes and mouth, cut out of the silhouette. */
const EYE_LUMA = 90;
/** Radius of the majority filter that smooths the mask's edges and removes slivers a few pixels thin. */
const SMOOTH_RADIUS = 4;
/** Specks of the cat mask (or holes in it) smaller than this many pixels are noise, dropped. */
const MIN_REGION = 400;

type Box = { x: number; y: number; w: number; h: number };
export interface BrandLogo {
  file: string;
  png: PNG;
  /** Opaque pictures are written without an alpha channel: the App Store refuses an icon that has one. */
  opaque: boolean;
}

/**
 * Area-averaged resample of a source box into a width × height picture, in premultiplied alpha so transparent
 * edges do not bleed dark fringes.
 */
function resample(src: PNG, box: Box, width: number, height: number): PNG {
  const out = new PNG({ width, height });
  const sx = box.w / width;
  const sy = box.h / height;
  for (let y = 0; y < height; y++) {
    const y0 = box.y + y * sy;
    const y1 = y0 + sy;
    for (let x = 0; x < width; x++) {
      const x0 = box.x + x * sx;
      const x1 = x0 + sx;
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let area = 0;
      for (let py = Math.floor(y0); py < Math.ceil(y1); py++) {
        const wy = Math.min(y1, py + 1) - Math.max(y0, py);
        for (let px = Math.floor(x0); px < Math.ceil(x1); px++) {
          const wx = Math.min(x1, px + 1) - Math.max(x0, px);
          const weight = wx * wy;
          const i = (py * src.width + px) * 4;
          const alpha = (src.data[i + 3] ?? 0) / 255;
          r += (src.data[i] ?? 0) * alpha * weight;
          g += (src.data[i + 1] ?? 0) * alpha * weight;
          b += (src.data[i + 2] ?? 0) * alpha * weight;
          a += alpha * weight;
          area += weight;
        }
      }
      const o = (y * width + x) * 4;
      out.data[o] = a > 0 ? Math.round(r / a) : 0;
      out.data[o + 1] = a > 0 ? Math.round(g / a) : 0;
      out.data[o + 2] = a > 0 ? Math.round(b / a) : 0;
      out.data[o + 3] = Math.round((a / area) * 255);
    }
  }
  return out;
}

const scaled = (src: PNG, size: number): PNG => (src.width === size ? src : resample(src, { x: 0, y: 0, w: src.width, h: src.height }, size, size));

/** Per row, the mean colour of the outer columns at both sides: the sky behind the art in that row. */
function rowSky(src: PNG): number[][] {
  const columns = Math.min(EDGE_COLUMNS, Math.floor(src.width / 2));
  const rows: number[][] = [];
  for (let y = 0; y < src.height; y++) {
    const sum = [0, 0, 0];
    for (let k = 0; k < columns; k++) {
      for (const x of [k, src.width - 1 - k]) {
        const i = (y * src.width + x) * 4;
        for (let c = 0; c < 3; c++) sum[c] = (sum[c] ?? 0) + (src.data[i + c] ?? 0);
      }
    }
    rows.push(sum.map((v) => v / (2 * columns)));
  }
  return rows;
}

/**
 * The master scaled to `scale` of a `size` square and centred; around it the sky continues from the scaled art's own
 * edge rows (clamped above and below), with the art's border blended into it.
 */
export function inset(master: PNG, scale: number, size: number): PNG {
  const side = Math.round(size * scale);
  const small = scaled(master, side);
  const sky = rowSky(small);
  const offset = Math.floor((size - side) / 2);
  const feather = Math.max(1, Math.round(side * FEATHER));
  const out = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    const row = sky[Math.min(side - 1, Math.max(0, y - offset))] ?? [0, 0, 0];
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 4;
      const ax = x - offset;
      const ay = y - offset;
      const inside = ax >= 0 && ay >= 0 && ax < side && ay < side;
      const weight = inside ? Math.min(1, Math.min(ax, side - 1 - ax, ay, side - 1 - ay) / feather) : 0;
      const i = (ay * side + ax) * 4;
      for (let c = 0; c < 3; c++) {
        const art = inside ? (small.data[i + c] ?? 0) : 0;
        out.data[o + c] = Math.round(art * weight + (row[c] ?? 0) * (1 - weight));
      }
      out.data[o + 3] = 255;
    }
  }
  return out;
}

/** Sets every 4-connected region of `value` pixels smaller than MIN_REGION to the other value. */
function dropSmallRegions(mask: Uint8Array, width: number, value: 0 | 1): void {
  const seen = new Uint8Array(mask.length);
  const stack: number[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (seen[start] || mask[start] !== value) continue;
    const region: number[] = [];
    seen[start] = 1;
    stack.push(start);
    while (stack.length > 0) {
      const p = stack.pop() ?? 0;
      region.push(p);
      const x = p % width;
      const neighbours = [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width];
      for (const n of neighbours) {
        if (n < 0 || n >= mask.length || seen[n] || mask[n] !== value) continue;
        seen[n] = 1;
        stack.push(n);
      }
    }
    if (region.length < MIN_REGION) for (const p of region) mask[p] = value === 1 ? 0 : 1;
  }
}

/** Each pixel becomes the majority value of the (2r + 1)² square around it (summed-area table). */
function majority(mask: Uint8Array, width: number, height: number, r: number): Uint8Array {
  const sums = new Uint32Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += mask[y * width + x] ?? 0;
      sums[(y + 1) * (width + 1) + x + 1] = (sums[y * (width + 1) + x + 1] ?? 0) + row;
    }
  }
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(height, y + r + 1);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(width, x + r + 1);
      const at = (yy: number, xx: number): number => sums[yy * (width + 1) + xx] ?? 0;
      const count = at(y1, x1) - at(y0, x1) - at(y1, x0) + at(y0, x0);
      out[y * width + x] = count * 2 > (y1 - y0) * (x1 - x0) ? 1 : 0;
    }
  }
  return out;
}

/**
 * The cat head as a 0/1 mask of the master: pixels far from their row's sky colour, with holes filled and specks
 * dropped, then the dark eyes and mouth cut back out and the edges smoothed.
 */
export function catMask(master: PNG): Uint8Array {
  const { width, height } = master;
  const sky = rowSky(master);
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const row = sky[y] ?? [0, 0, 0];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const distance = Math.hypot(
        (master.data[i] ?? 0) - (row[0] ?? 0),
        (master.data[i + 1] ?? 0) - (row[1] ?? 0),
        (master.data[i + 2] ?? 0) - (row[2] ?? 0),
      );
      mask[y * width + x] = distance > SKY_DISTANCE ? 1 : 0;
    }
  }
  dropSmallRegions(mask, width, 1);
  // Everything the sky around the picture cannot reach is the head (fills the face's features).
  const outside = new Uint8Array(mask.length);
  const stack: number[] = [];
  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
  while (stack.length > 0) {
    const p = stack.pop() ?? 0;
    if (outside[p] || mask[p]) continue;
    outside[p] = 1;
    const x = p % width;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (p >= width) stack.push(p - width);
    if (p + width < mask.length) stack.push(p + width);
  }
  for (let p = 0; p < mask.length; p++) {
    if (outside[p]) continue;
    const i = p * 4;
    const luma = 0.299 * (master.data[i] ?? 0) + 0.587 * (master.data[i + 1] ?? 0) + 0.114 * (master.data[i + 2] ?? 0);
    mask[p] = luma < EYE_LUMA ? 0 : 1;
  }
  const smooth = majority(mask, width, height, SMOOTH_RADIUS);
  dropSmallRegions(smooth, width, 0);
  dropSmallRegions(smooth, width, 1);
  return smooth;
}

/** The cat head in white on transparent, at the adaptive icon's place and size, with anti-aliased edges. */
export function monochrome(master: PNG, scale: number, size: number): PNG {
  const mask = catMask(master);
  const full = new PNG({ width: master.width, height: master.height });
  for (let p = 0; p < mask.length; p++) {
    full.data.fill(255, p * 4, p * 4 + 3);
    full.data[p * 4 + 3] = mask[p] ? 255 : 0;
  }
  const side = Math.round(size * scale);
  const small = scaled(full, side);
  const offset = Math.floor((size - side) / 2);
  const out = new PNG({ width: size, height: size });
  out.data.fill(0);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const o = ((offset + y) * size + offset + x) * 4;
      out.data.fill(255, o, o + 3);
      out.data[o + 3] = small.data[(y * side + x) * 4 + 3] ?? 0;
    }
  }
  return out;
}

export function renderBrandLogos(master: PNG): BrandLogo[] {
  if (master.width !== MASTER || master.height !== MASTER) throw new Error(`logo master must be ${MASTER} × ${MASTER}`);
  return [
    ...[1024, 512, 192, 180, 120, 32].map((size) => ({ file: `miu-logo-${size}.png`, png: scaled(master, size), opaque: true })),
    { file: 'miu-logo-maskable-512.png', png: scaled(inset(master, MASKABLE_SCALE, MASTER), 512), opaque: true },
    { file: 'miu-logo-adaptive-1024.png', png: inset(master, ADAPTIVE_SCALE, MASTER), opaque: true },
    { file: 'miu-logo-monochrome-1024.png', png: monochrome(master, ADAPTIVE_SCALE, MASTER), opaque: false },
  ];
}

async function main(): Promise<void> {
  const master = PNG.sync.read(await readFile(MASTER_PATH));
  const logos = renderBrandLogos(master);
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  for (const { file, png, opaque } of logos) {
    await writeFile(path.join(OUT_DIR, file), PNG.sync.write(png, opaque ? { colorType: 2 } : {}));
  }
  console.log(`render-brand-logo: ${logos.length} images in ${path.relative(process.cwd(), OUT_DIR)}`);
  await writeManifest();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
