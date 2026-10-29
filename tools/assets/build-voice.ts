// `pnpm assets:voice`: reads every character line (voice-lines.ts) aloud with VieNeu-TTS v3 Turbo on the owner's
// PC and keeps it as 16 kbps mono AAC in assets/generated/voice/<key>.m4a, with index.json for the web
// (voice-files.ts). Only lines without a file, or whose voice or spoken text changed, are read; files of lines that
// are gone are deleted. content/voice/recorded.json remembers who read what. Needs the PC's voice server
// (hoandat-app tools/artgen/voice-server.py; VOICE_URL, default its loopback address on the PC) and ffmpeg.
//
// The PC's GPU is shared, so the run paces itself: after each line it rests as long as the line took (about half
// load), and every WORK_MINUTES it pauses REST_MINUTES. `--no-pace` drops both, `--limit <n>` stops after n lines,
// `--redo <key,key>` reads those lines again (a bad take found by listening or by the speech-recognition check).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { VOICE_DIR, VOICE_INDEX_PATH, voiceFilePath, type VoiceIndex } from '../../apps/web/src/ui/dialogue/voice-files';
import { VERSION_CHARS } from '../../apps/web/src/asset-versions';
import { CONTENT_DIR } from '../../apps/server/src/content/content-catalog';
import { ASSETS_DIR } from './asset-lib';
import { writeManifest } from './build-manifest';
import { collectVoiceLines, type VoiceLine } from './voice-lines';

const RECORDED_FILE = path.join(CONTENT_DIR, 'voice/recorded.json');
const WORK_MINUTES = 20;
const REST_MINUTES = 10;

const Recorded = z.record(z.string(), z.strictObject({ voice: z.string(), spoken: z.string() }));
type Recorded = z.infer<typeof Recorded>;

let stopping = false;

/** Waits `ms`, or less once Ctrl+C asks the run to stop. */
async function rest(ms: number): Promise<void> {
  const until = Date.now() + ms;
  while (!stopping && Date.now() < until) await new Promise((resolve) => setTimeout(resolve, Math.min(1000, until - Date.now())));
}

function readRecorded(): Recorded {
  return existsSync(RECORDED_FILE) ? Recorded.parse(JSON.parse(readFileSync(RECORDED_FILE, 'utf8'))) : {};
}

function sortedJson(record: Record<string, unknown>): string {
  return `${JSON.stringify(Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b))), null, 1)}\n`;
}

async function readAloud(base: string, line: VoiceLine): Promise<Buffer> {
  const res = await fetch(`${base}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: line.spoken, voice: line.voice }),
  });
  if (!res.ok) throw new Error(`voice server refused ${line.key} (${res.status}): ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

function encode(wav: Buffer, target: string): void {
  // Speech only: mono 22.05 kHz is plenty, and 16 kbps keeps ~2,600 lines (about 4.7 hours) near 34 MB.
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', 'pipe:0', '-map_metadata', '-1', '-fflags', '+bitexact', '-ac', '1', '-ar', '22050', '-c:a', 'aac', '-b:a', '16k', '-movflags', '+faststart', target], { input: wav });
}

function writeIndex(lines: readonly VoiceLine[]): void {
  const entries: Record<string, string> = {};
  for (const line of lines) {
    const file = path.join(ASSETS_DIR, voiceFilePath(line.key));
    if (existsSync(file)) entries[line.key] = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, VERSION_CHARS);
  }
  const index: VoiceIndex = { version: 1, lines: Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))) };
  writeFileSync(path.join(ASSETS_DIR, VOICE_INDEX_PATH), `${JSON.stringify(index)}\n`);
}

function option(name: string): string | undefined {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : undefined;
}

async function main(): Promise<void> {
  const base = (process.env.VOICE_URL ?? 'http://127.0.0.1:8189').replace(/\/$/, '');
  const pace = !process.argv.includes('--no-pace');
  const limit = Number(option('--limit') ?? Infinity);
  if (!(limit > 0)) throw new Error('--limit takes a positive number of lines');
  const redo = new Set((option('--redo') ?? '').split(',').filter(Boolean));
  const lines = collectVoiceLines();
  const keep = new Set(lines.map((l) => l.key));
  const dir = path.join(ASSETS_DIR, VOICE_DIR);
  mkdirSync(dir, { recursive: true });
  const recorded = readRecorded();

  let removed = 0;
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.m4a') && !keep.has(name.slice(0, -4))) {
      rmSync(path.join(dir, name));
      removed += 1;
    }
  }
  for (const key of Object.keys(recorded)) if (!keep.has(key)) delete recorded[key];

  const todo = lines.filter((l) => {
    const had = recorded[l.key];
    return redo.has(l.key) || !existsSync(path.join(ASSETS_DIR, voiceFilePath(l.key))) || had?.voice !== l.voice || had?.spoken !== l.spoken;
  });
  console.log(`${lines.length} lines, ${todo.length} to read, ${removed} old files removed`);

  let workStarted = Date.now();
  let done = 0;
  try {
    for (const line of todo.slice(0, limit)) {
      if (stopping) break;
      const started = Date.now();
      encode(await readAloud(base, line), path.join(ASSETS_DIR, voiceFilePath(line.key)));
      recorded[line.key] = { voice: line.voice, spoken: line.spoken };
      done += 1;
      if (done % 25 === 0) {
        writeFileSync(RECORDED_FILE, sortedJson(recorded)); // a stopped run keeps what it read
        console.log(`${done}/${Math.min(todo.length, limit)} read`);
      }
      if (!pace) continue;
      await rest(Date.now() - started);
      if (Date.now() - workStarted > WORK_MINUTES * 60_000) {
        console.log(`resting ${REST_MINUTES} minutes so the GPU cools down`);
        await rest(REST_MINUTES * 60_000);
        workStarted = Date.now();
      }
    }
  } finally {
    // A run cut short (voice server down, Ctrl+C) still lists what it read, so the asset gate stays green.
    writeFileSync(RECORDED_FILE, sortedJson(recorded));
    writeIndex(lines);
    await writeManifest();
  }
  console.log(`${done} lines read; ${lines.length - todo.length + done} of ${lines.length} have a file`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Ctrl+C stops after the line under way, and the files read so far are listed (main's finally).
  process.once('SIGINT', () => {
    stopping = true;
    console.log('stopping after this line');
  });
  await main();
}
