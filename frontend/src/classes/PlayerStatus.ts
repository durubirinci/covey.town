// PROTOTYPE (research task 10): these types will move to shared/types/CoveyTownSocket.d.ts
// once the status data types are designed and the server tracks statuses.
export type PlayerStatusKind = 'Focused' | 'On break' | 'AFK';

export type PlayerStatus = {
  kind: PlayerStatusKind;
  /** When the status ends, in milliseconds since the epoch (an absolute time, not time left) */
  expiresAt: number;
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * The text to show above a player for their status, e.g. "Focused 24:13" or "On break 1:05:00".
 * The time left is computed from the absolute expiry time, so it stays correct even if the
 * display was not refreshed for a while (paused game, background tab).
 *
 * @returns undefined if there is no status or it has expired
 */
export function formatPlayerStatus(
  status: PlayerStatus | undefined,
  now: number,
): string | undefined {
  if (!status || status.expiresAt <= now) {
    return undefined;
  }
  const totalSeconds = Math.ceil((status.expiresAt - now) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const time =
    hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
  return `${status.kind} ${time}`;
}
