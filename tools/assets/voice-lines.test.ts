import { describe, expect, it } from 'vitest';
import { collectVoiceLines, genderOfDescription, readCast, respell, voiceFor, type VoiceCast } from './voice-lines';

const cast: VoiceCast = { female: ['Trúc Ly', 'Ngọc Huyền'], male: ['Hải Đăng', 'Thiện Minh'], speakers: { 'Vẹt': 'Mai Anh' }, say: { 'Tò He': 'Tò He' } };

describe('voice cast', () => {
  it('pins a voice by name, else picks the pool from the title, else from the description', () => {
    expect(voiceFor('Vẹt', cast, new Map())).toBe('Mai Anh');
    expect(cast.male).toContain(voiceFor('Ông Bảy Cờ Gánh', cast, new Map()));
    expect(cast.female).toContain(voiceFor('Cô Thủ Thư Mai', cast, new Map()));
    expect(cast.male).toContain(voiceFor('Gấu Gác Hầm', cast, new Map([['Gấu Gác Hầm', 'male']])));
  });

  it('keeps one voice per speaker', () => {
    expect(voiceFor('Khỉ Hái Dừa', cast, new Map())).toBe(voiceFor('Khỉ Hái Dừa', cast, new Map()));
  });

  it('reads pronouns of an English description, and gives up on a tie', () => {
    expect(genderOfDescription('Calls himself Uncle and talks slowly')).toBe('male');
    expect(genderOfDescription('Stretches her words like spun sugar')).toBe('female');
    expect(genderOfDescription('Talks fast')).toBeNull();
  });

  it('respells only what the voice hears', () => {
    expect(respell('Chú AI ơi', { AI: 'ây ai' })).toBe('Chú ây ai ơi');
  });
});

describe('collectVoiceLines', () => {
  const lines = collectVoiceLines(readCast());

  it('reads every character line once, never one that differs per player', () => {
    expect(lines.length).toBeGreaterThan(1000);
    expect(new Set(lines.map((l) => l.key)).size).toBe(lines.length);
    expect(lines.some((l) => l.text.includes('{name}') || l.text.includes('{who}'))).toBe(false);
  });

  it('casts only voices of the cast file', () => {
    const voices = new Set([...readCast().female, ...readCast().male, ...Object.values(readCast().speakers)]);
    expect(lines.every((l) => voices.has(l.voice))).toBe(true);
  });
});
