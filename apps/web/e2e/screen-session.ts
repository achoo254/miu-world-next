// Browsers for the hand-run picture specs (screens.spec.ts for the release review, store-screens.spec.ts for the app
// stores): a signed-out screen at a given size, a fresh fake player in it, and the game drawn and settled. Fake
// accounts in the in-memory database only.
import { expect, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { freshChild } from './quest-api';
import { readStats, waitReady } from './stats';

export interface ScreenSize {
  width: number;
  height: number;
  /** Device pixels per CSS pixel: the picture is width × scale by height × scale. */
  scale?: number;
}

/** A signed-out browser at this size, by touch. */
export async function newScreen(browser: Browser, baseURL: string, size: ScreenSize): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.scale ?? 1,
    hasTouch: true,
    storageState: { cookies: [], origins: [] },
  });
  // Every wait is bounded, so a screen that does not come up is noted as missing instead of stalling the run.
  // `MIU_SCREENS_LANG=en` (or `both`) pictures the screens in that display mode, for a look at the English; those
  // pictures go elsewhere (screens.spec.ts) and are not the reviewed set.
  const lang = process.env.MIU_SCREENS_LANG;
  if (lang) {
    await context.addInitScript((mode) => {
      const read = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key: string) {
        return key.startsWith('miu.lang') ? mode : read.call(this, key);
      };
    }, lang);
  }
  context.setDefaultTimeout(20_000);
  context.setDefaultNavigationTimeout(30_000);
  return { context, page: await context.newPage() };
}

/** A fresh fake account with its primary player `name`, companion bots turned off so they stay out of the pictures. */
export async function newPlayer(browser: Browser, baseURL: string, size: ScreenSize, name = 'Mochi'): Promise<{ context: BrowserContext; page: Page }> {
  const { context, page } = await newScreen(browser, baseURL, size);
  await freshChild(page, baseURL, name);
  const headers = { Origin: new URL(baseURL).origin };
  expect((await page.context().request.put('/api/player-settings', { headers, data: { botsEnabled: false } })).status()).toBe(200);
  return { context, page };
}

/** The game drawn and settled: ready, and a few frames drawn since. */
export async function gameSettled(page: Page): Promise<void> {
  await waitReady(page);
  const frames = (await readStats(page)).frames;
  await expect.poll(async () => (await readStats(page)).frames, { timeout: 15_000 }).toBeGreaterThan(frames + 10);
}

/**
 * Every picture in `scope` (the element itself when it is a picture) loaded and drawn: an emoji or a portrait still on
 * its way shows as an empty box in a screenshot. Pictures the page loads lazily wait until they are scrolled to, so
 * they are left out. Fails, naming the pictures, when one never draws (a broken address).
 */
export async function imagesDrawn(scope: Locator, timeout = 10_000): Promise<void> {
  await expect
    .poll(
      () =>
        scope.evaluate((root) => {
          const pictures = root instanceof HTMLImageElement ? [root] : [...root.querySelectorAll('img')];
          return pictures.filter((img) => img.loading !== 'lazy' && !(img.complete && img.naturalWidth > 0)).map((img) => img.currentSrc || img.src);
        }),
      { message: 'pictures not drawn', timeout },
    )
    .toEqual([]);
}
