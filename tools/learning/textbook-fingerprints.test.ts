import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FINGERPRINTS_FILE, decodeFingerprints, encodeFingerprints, fingerprintKey, fingerprintWords, keyCheckOf, readFingerprints, readKeyCheck, shingleHashes } from './textbook-fingerprints';

const KEY = Buffer.alloc(32, 7);

describe('textbook fingerprints', () => {
  it('see bare words: case, punctuation, spacing and diacritics do not matter', () => {
    expect(fingerprintWords('  Ngày khai trường   đã ĐẾN!\n“Con muốn…”')).toEqual(['ngay', 'khai', 'truong', 'da', 'den', 'con', 'muon']);
    expect(shingleHashes('Ngày khai trường đã đến, con muốn', KEY)).toEqual(shingleHashes('ngày khai trường đã đến con muốn.', KEY));
    // A copy typed without accents, or with the old tone placement, is the same copy.
    expect(shingleHashes('Ngay khai truong da den con muon', KEY)).toEqual(shingleHashes('Ngày khai trường đã đến con muốn', KEY));
    expect(shingleHashes('hoà thuận vui vẻ cả nhà cùng cười', KEY)).toEqual(shingleHashes('hòa thuận vui vẻ cả nhà cùng cười', KEY));
  });

  it('hash every 7-word run under the key, and nothing in a shorter text', () => {
    expect(shingleHashes('một hai ba bốn năm sáu', KEY)).toEqual([]);
    expect(shingleHashes('một hai ba bốn năm sáu bảy tám', KEY)).toHaveLength(2);
    // Without the key nobody can test a guessed word against the file.
    expect(shingleHashes('một hai ba bốn năm sáu bảy', Buffer.alloc(32, 8))).not.toEqual(shingleHashes('một hai ba bốn năm sáu bảy', KEY));
  });

  it('read the key from MIU_FINGERPRINT_KEY or the owner iCloud file, and refuse a malformed one', () => {
    expect(fingerprintKey({ MIU_FINGERPRINT_KEY: '07'.repeat(32), MIU_ICLOUD_DIR: '/nowhere' }, keyCheckOf(KEY))).toEqual(KEY);
    expect(fingerprintKey({ MIU_ICLOUD_DIR: '/nowhere' })).toBeNull();
    expect(() => fingerprintKey({ MIU_FINGERPRINT_KEY: 'abc' })).toThrow(/64 hex/);
  });

  it('refuse a well-formed key that is not the one the fingerprints were made with', () => {
    // An all-zero key (a placeholder secret) is well-formed but would match no shingle at all.
    expect(() => fingerprintKey({ MIU_FINGERPRINT_KEY: '0'.repeat(64), MIU_ICLOUD_DIR: '/nowhere' })).toThrow(/not the one the fingerprints were made with/);
    expect(() => fingerprintKey({ MIU_FINGERPRINT_KEY: '07'.repeat(32), MIU_ICLOUD_DIR: '/nowhere' }, keyCheckOf(Buffer.alloc(32, 8)))).toThrow(/not the one/);
    expect(keyCheckOf(KEY)).toMatch(/^[0-9a-f]{16}$/);
    expect(readKeyCheck()).toMatch(/^[0-9a-f]{16}$/);
  });

  // On CI the secret is set; on a machine without the owner's iCloud there is no key, and this case is skipped.
  const realKey = (() => {
    try {
      return fingerprintKey();
    } catch {
      return 'mismatch' as const;
    }
  })();
  it.skipIf(realKey === null)('accept the real key, which matches the committed check value', () => {
    if (realKey === 'mismatch' || realKey === null) throw new Error('the key on this machine is not the one the fingerprints were made with');
    expect(keyCheckOf(realKey)).toBe(readKeyCheck());
  });

  it('round-trip through the file format, sorted and without duplicates', () => {
    const hashes = [...shingleHashes('một hai ba bốn năm sáu bảy tám chín', KEY), ...shingleHashes('một hai ba bốn năm sáu bảy', KEY)];
    const data = encodeFingerprints(hashes);
    expect(data.length).toBe(3 * 5);
    expect(decodeFingerprints(data)).toEqual(new Set(hashes));
    expect(() => decodeFingerprints(Buffer.alloc(7))).toThrow(/multiple of 5/);
  });

  it('the committed file is the one made from the textbooks before they were removed', () => {
    const data = readFileSync(FINGERPRINTS_FILE);
    expect(createHash('sha256').update(data).digest('hex')).toBe('1523d40a0efdf6caed3972c7a5743cc17d6503ba21a04917f4daa0ef6aedfd27');
    expect(readFingerprints().size).toBe(26588);
  });
});
