// Pre-recorded Vietnamese voice lines: where they live and how a shown line finds its file. `pnpm assets:voice`
// reads every character line aloud once (VieNeu-TTS on the owner's PC, built-in voices only) into
// assets/generated/voice/<key>.m4a and lists the keys in index.json; speech.ts plays the file when there is one and
// falls back to the device voice otherwise. The key is a hash of the line as shown, so the web finds a file from the
// text alone. Plain data on purpose: vite.config and the asset tools import it.

export const VOICE_DIR = 'generated/voice';
export const VOICE_INDEX_PATH = `${VOICE_DIR}/index.json`;

/** index.json: line key → the start of the file's sha256 (the URL version, so a re-read line is never served stale). */
export interface VoiceIndex {
  version: 1;
  lines: Record<string, string>;
}

/** The line as the key sees it: Unicode NFC, runs of spaces folded, trimmed. */
export function normalizeVoiceText(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** cyrb53: a fast 53-bit string hash (public domain, bryc). Synchronous, so a tap can start playing at once. */
function cyrb53(text: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** The file key of a Vietnamese line: 14 hex characters. The build fails on a collision. */
export function voiceKey(text: string): string {
  return cyrb53(normalizeVoiceText(text)).toString(16).padStart(14, '0');
}

export function voiceFilePath(key: string): string {
  return `${VOICE_DIR}/${key}.m4a`;
}
