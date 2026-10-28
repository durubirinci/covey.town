import { activeStatus, isStatusExpired, PlayerStatus } from './PlayerStatus';

/** How long a player can go without using the keyboard or mouse before they are marked AFK */
export const AUTO_AFK_IDLE_MS = 5 * 60_000;

/** Reads and sets the status of our player; TownController provides this */
export interface StatusOwner {
  readonly status: PlayerStatus | undefined;
  setStatus(newStatus: PlayerStatus): void;
}

/**
 * Changes our player's status on its own (task 21):
 * - Active or Focused players who don't use the keyboard or mouse for AUTO_AFK_IDLE_MS become AFK.
 * - When an Away timer ends, the player becomes AFK if they are idle, and Active otherwise.
 * - When a Focused timer ends, the player becomes Active.
 * - An AFK player becomes Active as soon as they use the keyboard or mouse.
 *
 * Away players are not marked AFK while their timer runs, since they already said they are gone.
 *
 * Call recordActivity on every key press or mouse move, and check every second or so. All times
 * are passed in, in milliseconds since the epoch, so the tracker can be tested without timers.
 */
export default class AutoAfk {
  private _lastActivity: number;

  private readonly _owner: StatusOwner;

  private readonly _idleMs: number;

  constructor(owner: StatusOwner, now: number, idleMs = AUTO_AFK_IDLE_MS) {
    this._owner = owner;
    this._lastActivity = now;
    this._idleMs = idleMs;
  }

  /** Notes that the player is active, and brings an AFK player back to Active */
  recordActivity(now: number): void {
    this._lastActivity = now;
    if (this._owner.status?.kind === 'AFK') {
      this._owner.setStatus(activeStatus);
    }
  }

  /** Ends a timed status that has run out, and marks an idle player AFK */
  check(now: number): void {
    const status = this._owner.status ?? activeStatus;
    const isIdle = now - this._lastActivity >= this._idleMs;
    if (isStatusExpired(status, now)) {
      const goneAfk = status.kind === 'Away' && isIdle;
      this._owner.setStatus(goneAfk ? { kind: 'AFK' } : activeStatus);
    } else if (isIdle && (status.kind === 'Active' || status.kind === 'Focused')) {
      this._owner.setStatus({ kind: 'AFK' });
    }
  }
}
