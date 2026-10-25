// Fingerprints of the textbook wording the first learning quests were built from, so the content gate can refuse
// copied text without keeping the text itself. Each 7-word run (shingle) of the normalised wording is hashed with
// HMAC-SHA256 under a secret key and only the first 5 bytes are kept. The key matters: shingles overlap by six
// words, so with a plain hash anyone could rebuild the text word by word, guessing the next word and checking it
// against the file. Without the key nobody can test a guess. The key lives outside git (`MIU_FINGERPRINT_KEY`, the CI
// secret of the same name, or the owner's iCloud file below) and never changes: the file was made once (25/10/2026)
// from the textbook inventory and the first quests' readings, both since removed from the repo, so it cannot be
// rebuilt under a new key.
//
// content/learning/textbook-fingerprints.bin: 5-byte big-endian hashes, sorted, no duplicates;
// content/learning/textbook-fingerprints.key-check: the key's check value (`keyCheckOf`).
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { CONTENT_DIR } from '../../apps/server/src/content/content-dir';
import { icloudRoot } from '../private/sync-private';

export const SHINGLE_WORDS = 7;
const HASH_BYTES = 5;
export const FINGERPRINTS_FILE = path.join(CONTENT_DIR, 'learning/textbook-fingerprints.bin');

/** Where the key file sits in the owner's iCloud Drive, next to the project's other secrets. */
export const KEY_FILE_IN_ICLOUD = 'cong-viec/Cong viec/ENV production/miu-world/textbook-fingerprint.key';

/**
 * A check value for the key, committed next to the fingerprints: the first 8 bytes (hex) of HMAC(key, a fixed label).
 * It tells whether a key is the one the file was made with, and says nothing about the key: a well-formed but wrong
 * key would otherwise match no shingle at all and silently turn the copy check into a no-op.
 */
export const KEY_CHECK_FILE = path.join(CONTENT_DIR, 'learning/textbook-fingerprints.key-check');
const KEY_CHECK_LABEL = 'miu-fingerprint-key-check';
const KEY_CHECK_BYTES = 8;

export function keyCheckOf(key: Buffer): string {
  return createHmac('sha256', key).update(KEY_CHECK_LABEL).digest().subarray(0, KEY_CHECK_BYTES).toString('hex');
}

export function readKeyCheck(file: string = KEY_CHECK_FILE): string {
  const value = readFileSync(file, 'utf8').trim();
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(`${path.basename(file)} must hold 16 lower-case hex characters`);
  return value;
}

/**
 * The key (hex) from `MIU_FINGERPRINT_KEY`, else the iCloud file; null when neither is there. Never printed. A
 * malformed key, or one that is not the key the fingerprints were made with (`check`), is an error.
 */
export function fingerprintKey(env: NodeJS.ProcessEnv = process.env, check: string = readKeyCheck()): Buffer | null {
  let hex = env.MIU_FINGERPRINT_KEY?.trim();
  if (!hex) {
    const root = icloudRoot(env);
    const file = root ? path.join(root, KEY_FILE_IN_ICLOUD) : null;
    if (file && existsSync(file)) hex = readFileSync(file, 'utf8').trim();
  }
  if (!hex) return null;
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error('the textbook fingerprint key must be 64 hex characters');
  const key = Buffer.from(hex, 'hex');
  if (keyCheckOf(key) !== check) {
    throw new Error('the textbook fingerprint key is not the one the fingerprints were made with (content/learning/textbook-fingerprints.key-check)');
  }
  return key;
}

/**
 * Words of a text as the fingerprints see them: lower case, every diacritic dropped (so "hoà" and "hòa", or a copy
 * typed without accents, look the same), đ as d, punctuation and symbols dropped.
 */
export function fingerprintWords(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function hashShingle(words: readonly string[], key: Buffer): number {
  const digest = createHmac('sha256', key).update(words.join(' ')).digest();
  return digest.readUIntBE(0, HASH_BYTES);
}

/**
 * Hashes already made, per key and text: the content gate and its tests check the same thousands of lines again and
 * again, and the keyed hash is what costs.
 */
const cache = new Map<string, Map<string, readonly number[]>>();

/** Keyed hashes of every 7-word run of the text, in reading order (none for a text shorter than 7 words). */
export function shingleHashes(text: string, key: Buffer): readonly number[] {
  const id = key.toString('hex');
  let byText = cache.get(id);
  if (!byText) {
    byText = new Map();
    cache.set(id, byText);
  }
  const known = byText.get(text);
  if (known) return known;
  const words = fingerprintWords(text);
  const hashes: number[] = [];
  for (let i = 0; i + SHINGLE_WORDS <= words.length; i += 1) hashes.push(hashShingle(words.slice(i, i + SHINGLE_WORDS), key));
  byText.set(text, hashes);
  return hashes;
}

export function encodeFingerprints(hashes: Iterable<number>): Buffer {
  const sorted = [...new Set(hashes)].sort((a, b) => a - b);
  const out = Buffer.alloc(sorted.length * HASH_BYTES);
  sorted.forEach((h, i) => out.writeUIntBE(h, i * HASH_BYTES, HASH_BYTES));
  return out;
}

export function decodeFingerprints(data: Buffer): Set<number> {
  if (data.length % HASH_BYTES !== 0) throw new Error(`fingerprint file length ${data.length} is not a multiple of ${HASH_BYTES}`);
  const set = new Set<number>();
  for (let i = 0; i < data.length; i += HASH_BYTES) set.add(data.readUIntBE(i, HASH_BYTES));
  return set;
}

export function readFingerprints(file: string = FINGERPRINTS_FILE): Set<number> {
  return decodeFingerprints(readFileSync(file));
}
