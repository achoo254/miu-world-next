// The iPhone/Android app build (`vite build --mode native`, wrapped by apps/mobile): which server it talks to, and the
// Content-Security-Policy that lets its page (capacitor://localhost, https://localhost) reach that server and nothing
// else. The game's assets are not packed into the app: it reads them from the server's /game-assets/ over https; only
// the self-hosted fonts ship inside, so text renders before the network answers.
import { primaryOrigin } from '@shared-next/brand/hosts';
import type { Plugin } from 'vite';
import { brand } from './src/brand.ts';

export const NATIVE_MODE = 'native';
/** Output folder of the app build (Capacitor's `webDir`); the web build keeps `dist/`. */
export const NATIVE_OUT_DIR = 'dist-native';
/** The env variable that points an app build at another server (a dev server on this Mac, for the Simulator). */
export const SERVER_ORIGIN_ENV = 'VITE_MIU_SERVER_ORIGIN';

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Cloudflare Web Analytics, which Cloudflare's edge adds to the web pages it serves: its beacon script and the address
 * it posts to. The web policy allows both; the app's pages are packed inside the app and never pass the edge, so the
 * app's policy leaves them out.
 */
export const CLOUDFLARE_ANALYTICS = { script: 'https://static.cloudflareinsights.com', connect: 'https://cloudflareinsights.com' } as const;
const WEB_ONLY_SOURCES = new Set<string>(Object.values(CLOUDFLARE_ANALYTICS));

/**
 * The server origin an app build bakes in: `VITE_MIU_SERVER_ORIGIN` when set, else the brand's public web origin
 * (https://miu.hoandat.com). Must be a bare origin over https; plain http only to this machine (the iOS Simulator
 * reaches the Mac's loopback), never to a remote host.
 */
export function nativeServerOrigin(env: Readonly<Record<string, string | undefined>>): string {
  const raw = env[SERVER_ORIGIN_ENV]?.trim() || primaryOrigin(brand);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${SERVER_ORIGIN_ENV} is not a URL: ${raw}`);
  }
  if (url.origin !== raw.replace(/\/$/, '')) throw new Error(`${SERVER_ORIGIN_ENV} must be an origin only (no path, query or credentials): ${raw}`);
  const secure = url.protocol === 'https:' || (url.protocol === 'http:' && LOOPBACK.has(url.hostname));
  if (!secure) throw new Error(`${SERVER_ORIGIN_ENV} must use https (http only to localhost): ${raw}`);
  return url.origin;
}

/** The WebSocket origin of a server origin (`wss://` for https, `ws://` for a loopback dev server). */
const socketOrigin = (origin: string): string => origin.replace(/^http/, 'ws');

/**
 * The web policy with the server added where the app needs it: the API and the multiplayer socket (connect-src), the
 * game's pictures, sounds and model files (img-src, media-src, connect-src). Fonts are packed into the app, so
 * font-src stays 'self'. The web-only Cloudflare Web Analytics sources are dropped; every other directive is the web's.
 */
export function nativeContentSecurityPolicy(webPolicy: string, serverOrigin: string): string {
  const extra: Record<string, string[]> = {
    'connect-src': [serverOrigin, socketOrigin(serverOrigin)],
    'img-src': [serverOrigin],
    'media-src': [serverOrigin],
  };
  return webPolicy
    .split(';')
    .map((directive) => {
      const [name = '', ...values] = directive.trim().split(/\s+/);
      const kept = values.filter((value) => !WEB_ONLY_SOURCES.has(value));
      return [name, ...kept, ...(extra[name] ?? [])].join(' ');
    })
    .join('; ');
}

/**
 * The app draws under the notch and the home bar (`viewport-fit=cover`), so the `env(safe-area-inset-*)` paddings the
 * HUD and dialogs already carry take effect there. The web page keeps its viewport as it is.
 */
export function coverViewport(html: string): string {
  return html.replace(/(<meta\s+name="viewport"\s+content=")([^"]*)(")/, (_all, open: string, content: string, close: string) =>
    content.includes('viewport-fit=') ? `${open}${content}${close}` : `${open}${content}, viewport-fit=cover${close}`,
  );
}

export function nativeViewport(): Plugin {
  return { name: 'miu-native-viewport', apply: 'build', transformIndexHtml: (html) => coverViewport(html) };
}
