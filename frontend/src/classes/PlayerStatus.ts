// PROTOTYPE (research task 10): these types will move to shared/types/CoveyTownSocket.d.ts
// once the status data types are designed and the server tracks statuses.
export type PlayerStatusKind = 'Focused' | 'On break' | 'AFK';

export const PLAYER_STATUS_KINDS: PlayerStatusKind[] = ['Focused', 'On break', 'AFK'];

/** The durations, in minutes, offered by the status picker */
export const STATUS_DURATION_MINUTES = [15, 25, 45, 60];

/** The longest "What are you working on?" text a player can set */
export const MAX_WORKING_ON_LENGTH = 60;

export type PlayerStatus = {
  kind: PlayerStatusKind;
  /**
   * When the status ends, in milliseconds since the epoch (an absolute time, not time left).
   * Undefined for a status with no end time, such as the AFK status set automatically when a
   * player is idle, which lasts until they are active again.
   */
  expiresAt?: number;
  /** What the player is working on, e.g. "CS490 HW3", shown under their status */
  workingOn?: string;
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * @returns true if the status is set and has not expired
 */
export function isStatusActive(status: PlayerStatus | undefined, now: number): boolean {
  return status !== undefined && (status.expiresAt === undefined || status.expiresAt > now);
}

/**
 * The text to show above a player for their status, e.g. "Focused 24:13" or "On break 1:05:00".
 * The time left is computed from the absolute expiry time, so it stays correct even if the
 * display was not refreshed for a while (paused game, background tab). A status with no expiry
 * time is shown without a countdown, e.g. "AFK". If the player said what they are working on,
 * it is added on a second line.
 *
 * @returns undefined if there is no status or it has expired
 */
export function formatPlayerStatus(
  status: PlayerStatus | undefined,
  now: number,
): string | undefined {
  if (!status || !isStatusActive(status, now)) {
    return undefined;
  }
  let text: string = status.kind;
  if (status.expiresAt !== undefined) {
    const totalSeconds = Math.ceil((status.expiresAt - now) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const time =
      hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
    text = `${text} ${time}`;
  }
  const workingOn = status.workingOn?.trim();
  if (workingOn) {
    text = `${text}\n${workingOn}`;
  }
  return text;
}

/**
 * Builds the status a player picked in the status picker
 *
 * @param minutes how long the status lasts
 * @param workingOn what the player is working on; blank text is dropped, and long text is cut to
 *   MAX_WORKING_ON_LENGTH characters
 */
export function createPlayerStatus(
  kind: PlayerStatusKind,
  minutes: number,
  now: number,
  workingOn?: string,
): PlayerStatus {
  const status: PlayerStatus = { kind, expiresAt: now + minutes * 60_000 };
  const trimmed = workingOn?.trim().slice(0, MAX_WORKING_ON_LENGTH);
  if (trimmed) {
    status.workingOn = trimmed;
  }
  return status;
}
