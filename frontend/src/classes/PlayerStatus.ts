// PROTOTYPE (research task 10): these types will move to shared/types/CoveyTownSocket.d.ts
// once the status data types are designed and the server tracks statuses.
export type PlayerStatusKind = 'Active' | 'Focused' | 'Away' | 'AFK';

/** The statuses a player can pick for a set time in the status menu */
export const TIMED_STATUS_KINDS: PlayerStatusKind[] = ['Focused', 'Away'];

/** The durations, in minutes, offered by the status menu */
export const STATUS_DURATION_MINUTES = [15, 25, 45, 60];

export type PlayerStatus = {
  kind: PlayerStatusKind;
  /**
   * When a Focused or Away status ends, in milliseconds since the epoch (an absolute time, not
   * time left). Undefined for Active and AFK, which last until something changes them.
   */
  expiresAt?: number;
};

/** Every player starts as Active */
export const activeStatus: PlayerStatus = { kind: 'Active' };

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * @returns true if the status has an end time and it has passed
 */
export function isStatusExpired(status: PlayerStatus | undefined, now: number): boolean {
  return status?.expiresAt !== undefined && status.expiresAt <= now;
}

/**
 * The text to show for a player's status, e.g. "Focused 24:13", "Away 1:05:00" or "AFK".
 * The time left is computed from the absolute expiry time, so it stays correct even if the
 * display was not refreshed for a while (paused game, background tab).
 *
 * @returns undefined for an Active player (no status set, Active, or a timed status that ended)
 */
export function formatPlayerStatus(
  status: PlayerStatus | undefined,
  now: number,
): string | undefined {
  if (!status || status.kind === 'Active' || isStatusExpired(status, now)) {
    return undefined;
  }
  if (status.expiresAt === undefined) {
    return status.kind;
  }
  const totalSeconds = Math.ceil((status.expiresAt - now) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const time =
    hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
  return `${status.kind} ${time}`;
}

/**
 * Builds a Focused or Away status that lasts the given number of minutes
 */
export function createTimedStatus(
  kind: PlayerStatusKind,
  minutes: number,
  now: number,
): PlayerStatus {
  return { kind, expiresAt: now + minutes * 60_000 };
}
