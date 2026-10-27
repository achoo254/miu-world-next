import type { z } from 'zod';
import { ANALYTICS_HEADER } from '@miu/schema/analytics';
import { analyticsHeaderValue } from '../analytics/analytics-ids';
import { NATIVE_APP, apiUrl } from '../platform/endpoints';
import { authHeaders } from '../platform/session-token';
import { t, type TextKey } from './i18n/i18n';

/** Server error with its stable code (`invalid-credentials`, `consent-required`…). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

/** Code of a successful response this build cannot read: the server is newer than the build. */
export const OUTDATED_CLIENT = 'outdated-client';

/**
 * JSON call to the server (same origin on the web, the server's origin in the app: platform/endpoints.ts); responses are validated so the UI never trusts an unexpected shape.
 * `keepalive` lets a small write finish while the page is being closed or hidden. Every call carries the browser's
 * anonymous GA ids, so the usage events the server emits (sign-up, quests) join this visit.
 */
export async function api<S extends z.ZodType>(method: string, path: string, schema: S, body?: unknown, options: { keepalive?: boolean } = {}): Promise<z.infer<S>> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      credentials: 'same-origin',
      keepalive: options.keepalive,
      headers: { [ANALYTICS_HEADER]: analyticsHeaderValue(), ...authHeaders(), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network');
  }
  const data: unknown = res.status === 204 ? undefined : await res.json().catch(() => null);
  if (!res.ok) {
    const code = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string' ? data.error : 'unknown';
    throw new ApiError(res.status, code);
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    // The server answered, in a shape this build does not know: the build is older than the server (an app from the
    // store, a web tab opened before a release), not a network failure.
    console.warn(`unexpected response shape: ${method} ${path}`);
    throw new ApiError(res.status, OUTDATED_CLIENT);
  }
  return parsed.data;
}

/** Server error code → its message (locales `errors.*`). */
const MESSAGES: Readonly<Record<string, TextKey>> = {
  network: 'errors.network',
  [OUTDATED_CLIENT]: NATIVE_APP ? 'errors.outdatedApp' : 'errors.outdatedPage',
  'invalid-input': 'errors.invalidInput',
  'invalid-credentials': 'errors.invalidCredentials',
  'email-taken': 'errors.emailTaken',
  'rate-limited': 'errors.rateLimited',
  'primary-player': 'errors.primaryPlayer',
  'consent-required': 'errors.consentRequired',
  'profile-limit': 'errors.profileLimit',
  'invalid-display-name': 'errors.invalidDisplayName',
  'not-found': 'errors.notFound',
  'event-closed': 'errors.eventClosed',
  'equipment-locked': 'errors.equipmentLocked',
  'pet-locked': 'errors.petLocked',
  'no-pet-equipped': 'errors.noPetEquipped',
  'trick-locked': 'errors.trickLocked',
  'gear-not-owned': 'errors.gearNotOwned',
  'invalid-pet-name': 'errors.invalidPetName',
  'invalid-pet-gear': 'errors.invalidPetGear',
  'invalid-equipment': 'errors.invalidEquipment',
  'invalid-character-name': 'errors.invalidCharacterName',
  'invalid-species': 'errors.invalidSpecies',
  'friends-full': 'errors.friendsFull',
  'invite-limit': 'errors.inviteLimit',
  'online-off': 'errors.onlineOff',
  'voice-off': 'errors.voiceOff',
  'reauth-required': 'errors.reauthRequired',
  'idp-reauth': 'errors.idpReauth',
};

/** The message for a failed call, in the display mode chosen when it failed. */
export function errorMessage(err: unknown): string {
  const code = err instanceof ApiError ? err.code : 'unknown';
  return t(MESSAGES[code] ?? 'errors.unknown');
}
