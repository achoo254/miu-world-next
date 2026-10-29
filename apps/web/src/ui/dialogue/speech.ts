// Read-aloud in Vietnamese (vi-VN) or English (en-US). A Vietnamese line with a pre-recorded file
// (recorded-voice.ts, read once on the owner's PC) plays that file; any other line uses the browser's speech
// synthesis, and only a voice that runs on the device: "remote" voices (localService = false, e.g. some Chrome/Edge
// voices) send the text to the vendor's servers, which Master Plan §9 rules out. Neither a file nor a local voice →
// the line is not read (the "Nghe" button hides when nothing is). The speed follows the voice setting, the sound
// switch silences it, and a screen that closes stops it (listen-button.tsx, app-shell.tsx).
import { useEffect, useState } from 'react';
import type { Lang, LangMode } from '../i18n/i18n';
import { duckMusic } from '../sound/music-player';
import { onSoundSettingChange, readSoundOn } from '../system/sound-setting';
import { VOICE_RATE, readVoiceSpeed } from '../system/voice-setting';
import { recordedVoiceUrl, useRecordedVoices } from './recorded-voice';

type VoiceLike = Pick<SpeechSynthesisVoice, 'lang' | 'localService' | 'name'> & Partial<Pick<SpeechSynthesisVoice, 'default'>>;

const LOCALE: Readonly<Record<Lang, string>> = { vi: 'vi-VN', en: 'en-US' };
/** Names of the better-sounding voices some systems ship next to the basic ones (macOS, iOS, Windows). */
const RICH_VOICE = /premium|enhanced|natural|neural/i;

const tag = (voice: VoiceLike): string => voice.lang.toLowerCase().replace('_', '-');

/**
 * The best on-device voice for `lang`, or null: the exact locale (vi-VN, en-US) before another of the same
 * language (en-GB), a richer voice before a basic one, the system's default before the rest. Never a remote voice.
 */
export function bestVoice<V extends VoiceLike>(voices: readonly V[], lang: Lang): V | null {
  const exact = LOCALE[lang].toLowerCase();
  const score = (v: V): number => (tag(v) === exact ? 4 : 0) + (RICH_VOICE.test(v.name) ? 2 : 0) + (v.default ? 1 : 0);
  const candidates = voices.filter((v) => v.localService && tag(v).split('-')[0] === lang);
  return candidates.reduce<V | null>((best, v) => (best === null || score(v) > score(best) ? v : best), null);
}

function synthesis(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined' ? window.speechSynthesis : null;
}

/** One line to read, in its language. */
export interface SpokenLine {
  text: string;
  lang: Lang;
}

/** One line of a reading and how it is read: its recorded file, or an on-device voice. */
export type ReadingStep<V extends VoiceLike = SpeechSynthesisVoice> = SpokenLine & ({ file: string; voice?: undefined } | { file?: undefined; voice: V });

/** How `lines` are read: the recorded file of a Vietnamese line first, else the best local voice; neither → skipped. */
export function readingPlan<V extends VoiceLike>(lines: readonly SpokenLine[], voices: readonly V[], fileOf: (text: string) => string | null): ReadingStep<V>[] {
  return lines.flatMap((line): ReadingStep<V>[] => {
    if (line.text.trim() === '') return [];
    const file = line.lang === 'vi' ? fileOf(line.text) : null;
    if (file) return [{ ...line, file }];
    const voice = bestVoice(voices, line.lang);
    return voice ? [{ ...line, voice }] : [];
  });
}

/** Lets the music come back once the reading ends or is cut short. */
let releaseMusic: (() => void) | null = null;
/** Bumped by every new reading and every stop, so a cut-short reading never goes on to its next line. */
let reading = 0;
let playing: HTMLAudioElement | null = null;

function release(): void {
  releaseMusic?.();
  releaseMusic = null;
}

export function stopSpeaking(): void {
  reading += 1;
  playing?.pause();
  playing = null;
  const speech = synthesis();
  if (speech && (speech.speaking || speech.pending)) speech.cancel();
  release();
}

/** Calls `fn` the first time only: a failing file fires both `error` and a rejected `play()`. */
function once(fn: () => void): () => void {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    fn();
  };
}

/** Plays a recorded line; `failed` instead of `ended` when the file cannot play (offline, missing, no audio). */
function playFile(url: string, rate: number, ended: () => void, failed: () => void): void {
  const fail = once(failed);
  try {
    const audio = new Audio(url);
    audio.playbackRate = rate; // the pitch stays (preservesPitch is on by default)
    audio.onended = once(ended);
    audio.onerror = fail;
    playing = audio;
    void audio.play()?.catch(fail);
  } catch {
    fail(); // no audio here (tests, a locked-down browser)
  }
}

/**
 * Upper bound of a device reading, so a voice that never reports its end (WebKit may refuse an utterance started
 * outside a tap, after a recorded line) cannot keep the music lowered.
 */
const deviceTimeoutMs = (text: string, rate: number): number => (5 + text.length / (8 * rate)) * 1000;

/**
 * Reads `lines` one after the other, cutting off whatever was being read. Lines with neither a recorded file nor an
 * on-device voice are skipped, and a recorded file that cannot play falls back to the device voice; returns false
 * when nothing could be read (sound off, nothing readable).
 */
export function speakLines(lines: readonly SpokenLine[]): boolean {
  if (!readSoundOn()) return false;
  const speech = synthesis();
  const voices = speech?.getVoices() ?? [];
  const plan = readingPlan(lines, voices, recordedVoiceUrl);
  if (plan.length === 0) return false;
  stopSpeaking();
  const rate = VOICE_RATE[readVoiceSpeed()];
  const token = reading;
  // The music steps back while the lines are read.
  releaseMusic = duckMusic();
  const device = (text: string, voice: SpeechSynthesisVoice | null, after: () => void): void => {
    if (!speech || !voice) {
      after();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = rate;
    const watchdog = setTimeout(after, deviceTimeoutMs(text, rate));
    const end = (): void => {
      clearTimeout(watchdog);
      after();
    };
    utterance.onend = end;
    utterance.onerror = end;
    speech.speak(utterance);
  };
  const next = (i: number): void => {
    if (token !== reading) return;
    const step = plan[i];
    if (!step) {
      playing = null;
      release();
      return;
    }
    const after = once(() => next(i + 1));
    if (step.file !== undefined) {
      playFile(step.file, rate, after, () => {
        if (token === reading) device(step.text, bestVoice(voices, step.lang), after);
      });
      return;
    }
    device(step.text, step.voice, after);
  };
  next(0);
  return true;
}

/** Reads one line in `lang`. */
export const speak = (text: string, lang: Lang): boolean => speakLines([{ text, lang }]);

/**
 * A companion bot's line in a voice channel, in its own voice (pitch and rate) at `volume`, with an on-device voice
 * only. It never cuts off a reading under way: while something is read, the line is skipped (false), as it is with
 * the sound off or no voice for `lang`. `ended` is called once it is over (or cut short).
 */
export function speakVoiceLine(text: string, lang: Lang, voice: { pitch: number; rate: number }, volume: number, ended: () => void): boolean {
  const speech = synthesis();
  // `releaseMusic` is set for as long as a reading (a recorded file or the device voice) is under way.
  if (!speech || !readSoundOn() || volume <= 0 || text.trim() === '' || releaseMusic !== null || speech.speaking || speech.pending) return false;
  const local = bestVoice(speech.getVoices(), lang);
  if (!local) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = local;
  utterance.lang = local.lang;
  utterance.pitch = voice.pitch;
  utterance.rate = voice.rate;
  utterance.volume = Math.min(1, volume);
  let done = false;
  const end = (): void => {
    if (done) return;
    done = true;
    ended();
  };
  utterance.onend = end;
  utterance.onerror = end;
  speech.speak(utterance);
  return true;
}

/**
 * What a "Nghe" tap reads in `mode`: the line shown. In Song ngữ the Vietnamese, then the English when there is
 * one; untranslated text (textbook wording: `en` equal to `vi`, or no `en`) is read in Vietnamese in every mode.
 */
export function linesToRead(text: Readonly<{ vi: string; en?: string }>, mode: LangMode): SpokenLine[] {
  const english = text.en !== undefined && text.en !== text.vi ? text.en : null;
  if (mode === 'en' && english !== null) return [{ text: english, lang: 'en' }];
  if (mode === 'both' && english !== null) return [{ text: text.vi, lang: 'vi' }, { text: english, lang: 'en' }];
  return [{ text: text.vi, lang: 'vi' }];
}

/** The languages the device can read aloud now (none while the sound is off); follows `voiceschanged` and the sound switch. */
export function useSpeakableLangs(): ReadonlySet<Lang> {
  const [voices, setVoices] = useState<readonly SpeechSynthesisVoice[]>(() => synthesis()?.getVoices() ?? []);
  const [soundOn, setSoundOn] = useState(readSoundOn);
  useEffect(() => {
    const speech = synthesis();
    const offSound = onSoundSettingChange(() => setSoundOn(readSoundOn()));
    if (!speech) return offSound;
    // Voices load asynchronously in some browsers.
    const update = (): void => setVoices(speech.getVoices());
    update();
    speech.addEventListener('voiceschanged', update);
    return () => {
      offSound();
      speech.removeEventListener('voiceschanged', update);
    };
  }, []);
  if (!soundOn) return new Set();
  return new Set((['vi', 'en'] as const).filter((lang) => bestVoice(voices, lang) !== null));
}

/** Whether a line can be read now: a recorded file of it or an on-device voice of its language, with the sound on. */
export function useReadable(): (line: SpokenLine) => boolean {
  const speakable = useSpeakableLangs();
  const [soundOn, setSoundOn] = useState(readSoundOn);
  useEffect(() => onSoundSettingChange(() => setSoundOn(readSoundOn())), []);
  useRecordedVoices();
  return (line) => soundOn && (speakable.has(line.lang) || (line.lang === 'vi' && recordedVoiceUrl(line.text) !== null));
}

// Switching the sound off stops a reading under way.
onSoundSettingChange(() => {
  if (!readSoundOn()) stopSpeaking();
});
