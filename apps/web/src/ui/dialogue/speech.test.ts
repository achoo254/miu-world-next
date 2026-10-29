import { afterEach, describe, expect, it, vi } from 'vitest';
import { readingPlan, speakLines, speakVoiceLine, stopSpeaking } from './speech';
import { normalizeVoiceText, voiceKey } from './voice-files';
import { recordedVoiceUrl, setRecordedVoicesForTest } from './recorded-voice';

const musicBack = vi.fn();
vi.mock('../sound/music-player', () => ({ duckMusic: () => musicBack }));

/** An <audio> the test plays out by hand. */
class FakeAudio {
  static made: FakeAudio[] = [];
  playbackRate = 1;
  paused = false;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private reject: ((err: Error) => void) | null = null;
  constructor(readonly src: string) {
    FakeAudio.made.push(this);
  }
  play(): Promise<void> {
    return new Promise((_, reject) => {
      this.reject = reject;
    });
  }
  pause(): void {
    this.paused = true;
  }
  /** What a missing file does: an `error` event and a rejected `play()`, both. */
  fail(): void {
    this.onerror?.();
    this.reject?.(new Error('404'));
  }
}

afterEach(() => {
  stopSpeaking();
  FakeAudio.made = [];
  musicBack.mockClear();
  vi.unstubAllGlobals();
});

const local = { lang: 'vi-VN', localService: true, name: 'Linh' };
const english = { lang: 'en-US', localService: true, name: 'Samantha' };

describe('readingPlan', () => {
  const files = (text: string): string | null => (text === 'Chào cậu!' ? '/game-assets/generated/voice/x.m4a' : null);

  it('plays the recorded file of a Vietnamese line before any device voice', () => {
    expect(readingPlan([{ text: 'Chào cậu!', lang: 'vi' }], [local], files)).toEqual([{ text: 'Chào cậu!', lang: 'vi', file: '/game-assets/generated/voice/x.m4a' }]);
  });

  it('falls back to the on-device voice, and skips a line with neither', () => {
    const lines = [
      { text: 'Đi thôi!', lang: 'vi' as const },
      { text: 'Hello', lang: 'en' as const },
    ];
    expect(readingPlan(lines, [local, english], files).map((s) => s.voice?.name)).toEqual(['Linh', 'Samantha']);
    expect(readingPlan(lines, [english], files).map((s) => s.text)).toEqual(['Hello']);
    expect(readingPlan(lines, [], files)).toEqual([]);
  });

  it('never looks up a file for English, and a recorded line needs no device voice', () => {
    expect(readingPlan([{ text: 'Chào cậu!', lang: 'en' }], [], files)).toEqual([]);
    expect(readingPlan([{ text: 'Chào cậu!', lang: 'vi' }], [], files)).toHaveLength(1);
  });
});

describe('voice files', () => {
  it('keys a line by its text as shown, whatever its spacing or Unicode form', () => {
    expect(normalizeVoiceText('  Chào\n  cậu! ')).toBe('Chào cậu!');
    expect(voiceKey('Chào cậu!')).toBe(voiceKey('Chào cậu!'.normalize('NFD')));
    expect(voiceKey('Chào cậu!')).toMatch(/^[0-9a-f]{14}$/);
    expect(voiceKey('Chào cậu!')).not.toBe(voiceKey('Chào cậu?'));
  });

  it('gives the URL of a listed line with its content version, and null for any other', () => {
    setRecordedVoicesForTest({ [voiceKey('Chào cậu!')]: 'abc123def456' });
    expect(recordedVoiceUrl('Chào  cậu!')).toBe(`/game-assets/generated/voice/${voiceKey('Chào cậu!')}.m4a?v=abc123def456`);
    expect(recordedVoiceUrl('Tạm biệt!')).toBeNull();
  });
});

describe('speakLines with recorded files', () => {
  const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
  const one = 'Chào cậu!';
  const two = 'Đi thôi nào!';

  function setup(): { spoken: string[] } {
    setRecordedVoicesForTest({ [voiceKey(one)]: 'a', [voiceKey(two)]: 'b' });
    vi.stubGlobal('Audio', FakeAudio);
    const spoken: string[] = [];
    class Utterance {
      voice: unknown = null;
      lang = '';
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(readonly text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
    vi.stubGlobal('speechSynthesis', {
      speaking: false,
      pending: false,
      getVoices: () => [local, english],
      cancel: vi.fn(),
      speak: (u: Utterance) => {
        spoken.push(u.text);
        u.onend?.();
      },
    });
    return { spoken };
  }

  it('plays the files one after the other, then gives the music back', () => {
    setup();
    expect(speakLines([{ text: one, lang: 'vi' }, { text: two, lang: 'vi' }])).toBe(true);
    expect(FakeAudio.made).toHaveLength(1);
    FakeAudio.made[0]?.onended?.();
    expect(FakeAudio.made).toHaveLength(2);
    expect(musicBack).not.toHaveBeenCalled();
    FakeAudio.made[1]?.onended?.();
    expect(musicBack).toHaveBeenCalledTimes(1);
  });

  it('reads a file that fails with the device voice, once, then goes on', async () => {
    const { spoken } = setup();
    speakLines([{ text: one, lang: 'vi' }, { text: 'Hello', lang: 'en' }]);
    FakeAudio.made[0]?.fail();
    await flush();
    expect(spoken).toEqual([one, 'Hello']);
    expect(musicBack).toHaveBeenCalledTimes(1);
  });

  it('stops for good when cut short, and keeps a bot from talking over a file', () => {
    setup();
    speakLines([{ text: one, lang: 'vi' }, { text: two, lang: 'vi' }]);
    expect(speakVoiceLine('Xin chào', 'vi', { pitch: 1, rate: 1 }, 1, () => undefined)).toBe(false);
    stopSpeaking();
    expect(FakeAudio.made[0]?.paused).toBe(true);
    FakeAudio.made[0]?.onended?.();
    expect(FakeAudio.made).toHaveLength(1);
    expect(musicBack).toHaveBeenCalledTimes(1);
  });
});
