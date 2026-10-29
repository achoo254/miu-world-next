// The pre-recorded voice lines at run time (voice-files.ts): the index is fetched once, on the first screen with a
// "Nghe" button, and a Vietnamese line whose file is listed plays that file instead of the device voice. A page
// without the index (offline, tests, an old release) simply keeps the device voice.
import { useEffect, useState } from 'react';
import { versioned } from '../../asset-versions';
import { assetUrl as servedAssetUrl } from '../../platform/endpoints';
import { assetUrl } from '../kit/ui-art';
import { VOICE_INDEX_PATH, voiceFilePath, voiceKey, type VoiceIndex } from './voice-files';

let files: ReadonlyMap<string, string> = new Map();
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function loadIndex(): Promise<void> {
  if (!loading) {
    loading = fetch(assetUrl(VOICE_INDEX_PATH))
      .then((res) => (res.ok ? (res.json() as Promise<VoiceIndex>) : null))
      .then((index) => {
        if (!index || index.version !== 1) return;
        files = new Map(Object.entries(index.lines));
        listeners.forEach((listener) => listener());
      })
      .catch(() => {
        loading = null; // offline for now: the next screen tries again
      });
  }
  return loading;
}

/** The URL of the recorded file of a Vietnamese line as shown, or null. */
export function recordedVoiceUrl(text: string): string | null {
  const key = voiceKey(text);
  const version = files.get(key);
  return version === undefined ? null : versioned(servedAssetUrl(voiceFilePath(key)), version);
}

/** Loads the index on first use; re-renders the caller once it has arrived (the number changes). */
export function useRecordedVoices(): number {
  const [revision, setRevision] = useState(() => files.size);
  useEffect(() => {
    const update = (): void => setRevision(files.size);
    listeners.add(update);
    void loadIndex();
    return () => {
      listeners.delete(update);
    };
  }, []);
  return revision;
}

/** For tests: the index as if fetched. */
export function setRecordedVoicesForTest(index: VoiceIndex['lines']): void {
  files = new Map(Object.entries(index));
  loading = Promise.resolve();
}
