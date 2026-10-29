// The character lines `pnpm assets:voice` reads aloud, and who reads each one. A line is the Vietnamese as the
// screen shows it (speech.ts hashes the shown text), so `{who}` is filled with the character's name here; lines that
// address the player by `{name}` differ per player and stay with the device voice. Each speaker keeps one voice
// everywhere: content/voice/cast.json pins a voice by name, otherwise the speaker's title or the character's own
// description picks a male or female pool and the name picks within it, so no list needs keeping by hand.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { CONTENT_DIR, readQuestDefinitions } from '../../apps/server/src/content/content-catalog';
import { readNpcFiles } from '../../apps/server/src/npc/npc-catalog';
import { PLAYER_NAME_TOKEN } from '../../packages/quest/src/player-name';
import { normalizeVoiceText, voiceKey } from '../../apps/web/src/ui/dialogue/voice-files';

export const CAST_FILE = path.join(CONTENT_DIR, 'voice/cast.json');

const VoiceName = z.string().min(1);
export const VoiceCast = z.strictObject({
  /** Built-in VieNeu-TTS v3 Turbo voices; no voice is cloned from a real person. */
  female: z.array(VoiceName).min(1),
  male: z.array(VoiceName).min(1),
  /** Speakers whose title says nothing (most animals) pick from both pools. */
  speakers: z.record(z.string(), VoiceName).default({}),
  /** Words the model reads wrong, spelt the way it should say them (only the audio changes, never the screen). */
  say: z.record(z.string(), z.string()).default({}),
});
export type VoiceCast = z.infer<typeof VoiceCast>;

export interface VoiceLine {
  key: string;
  /** As shown (and hashed). */
  text: string;
  /** What the voice model is given: `text` with the `say` respellings. */
  spoken: string;
  speaker: string;
  voice: string;
}

export function readCast(file = CAST_FILE): VoiceCast {
  return VoiceCast.parse(JSON.parse(readFileSync(file, 'utf8')));
}

// The first word of a Vietnamese title tells how to address someone, and with it whether a man or a woman speaks.
const MALE_TITLES = new Set(['Ông', 'Bác', 'Chú', 'Anh', 'Cậu', 'Thầy', 'Bố', 'Thuyền', 'Tể']);
const FEMALE_TITLES = new Set(['Bà', 'Cô', 'Chị', 'Dì', 'Mẹ', 'Bé']);

/** "male" or "female" from an English character description (its pronouns), or null. */
export function genderOfDescription(text: string): 'male' | 'female' | null {
  const he = text.match(/\b(he|his|him|himself)\b/gi)?.length ?? 0;
  const she = text.match(/\b(she|her|hers|herself)\b/gi)?.length ?? 0;
  if (he === she) return null;
  return he > she ? 'male' : 'female';
}

/** A small stable hash, so a speaker keeps its voice when other speakers come and go. */
function nameHash(name: string): number {
  let h = 2166136261;
  for (const ch of name) h = Math.imul(h ^ (ch.codePointAt(0) ?? 0), 16777619);
  return h >>> 0;
}

export function voiceFor(speaker: string, cast: VoiceCast, described: ReadonlyMap<string, 'male' | 'female'>): string {
  const pinned = cast.speakers[speaker];
  if (pinned) return pinned;
  const title = speaker.split(' ')[0] ?? '';
  const gender = MALE_TITLES.has(title) ? 'male' : FEMALE_TITLES.has(title) ? 'female' : described.get(speaker);
  const pool = gender ? cast[gender] : [...cast.female, ...cast.male];
  const voice = pool[nameHash(speaker) % pool.length];
  if (voice === undefined) throw new Error('voice cast: empty pool');
  return voice;
}

export function respell(text: string, say: Readonly<Record<string, string>>): string {
  return Object.entries(say).reduce((out, [word, spoken]) => out.replaceAll(word, spoken), text);
}

/**
 * Every character line of the published quests (dialogue lines and the replies to a choice, spoken by the scene's
 * first speaker) and of the characters' everyday lines, once each; the first speaker found keeps a shared line.
 */
export function collectVoiceLines(cast: VoiceCast = readCast(), contentDir = CONTENT_DIR): VoiceLine[] {
  const npcFiles = readNpcFiles(path.join(contentDir, 'npcs'));
  const described = new Map<string, 'male' | 'female'>();
  for (const file of npcFiles) {
    for (const npc of file.npcs) {
      const gender = genderOfDescription(`${npc.voice.en} ${npc.personality.en}`);
      if (gender) described.set(npc.name, gender);
    }
  }
  const lines = new Map<string, VoiceLine>();
  const add = (raw: string, speaker: string): void => {
    if (raw.includes(PLAYER_NAME_TOKEN)) return;
    const text = normalizeVoiceText(raw);
    if (text === '') return;
    const key = voiceKey(text);
    const seen = lines.get(key);
    if (seen) {
      if (seen.text !== text) throw new Error(`voice key collision ${key}: "${seen.text}" / "${text}"`);
      return;
    }
    lines.set(key, { key, text, spoken: respell(text, cast.say), speaker, voice: voiceFor(speaker, cast, described) });
  };
  for (const quest of readQuestDefinitions(path.join(contentDir, 'quests'))) {
    // Only quests the game plays: drafts are not shown yet, stubs have no steps.
    if (quest.status !== 'active') continue;
    for (const step of quest.steps) {
      if (step.kind !== 'dialogue') continue;
      for (const line of step.lines) add(line.text, line.speaker);
      const first = step.lines[0]?.speaker ?? '';
      for (const choice of step.choices) if (choice.reply) add(choice.reply, first);
    }
  }
  for (const file of npcFiles) {
    for (const npc of file.npcs) for (const line of npc.lines) add(line.vi.replaceAll('{who}', npc.name), npc.name);
  }
  return [...lines.values()];
}
