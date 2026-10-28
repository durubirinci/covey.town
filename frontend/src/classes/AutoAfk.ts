import { isStatusActive, PlayerStatus } from './PlayerStatus';

/** How long a player can go without using the keyboard or mouse before they are marked AFK */
export const AUTO_AFK_IDLE_MS = 5 * 60_000;

/** Reads and sets the status of our player; TownController provides this */
export interface StatusOwner {
  readonly status: PlayerStatus | undefined;
  setStatus(newStatus: PlayerStatus | undefined): void;
}

function isAutoAfkStatus(status: PlayerStatus | undefined): boolean {
  return status?.kind === 'AFK' && status.expiresAt === undefined;
}

/**
 * Marks our player AFK after they have been idle for AUTO_AFK_IDLE_MS (task 18), and puts their
 * previous status back when they are active again.
 *
 * Call recordActivity on every key press or mouse move, and check every second or so. All times
 * are passed in, in milliseconds since the epoch, so the tracker can be tested without timers.
 */
export default class AutoAfk {
  private _lastActivity: number;

  private _isAutoAfk = false;

  private _statusBeforeAfk?: PlayerStatus;

  private readonly _owner: StatusOwner;

  private readonly _idleMs: number;

  constructor(owner: StatusOwner, now: number, idleMs = AUTO_AFK_IDLE_MS) {
    this._owner = owner;
    this._lastActivity = now;
    this._idleMs = idleMs;
  }

  /** True while the player is AFK because the tracker marked them so */
  get isAutoAfk(): boolean {
    return this._isAutoAfk;
  }

  /**
   * Notes that the player is active. If they were marked AFK automatically, their previous
   * status is put back, unless it has expired since or they set a new status in the meantime.
   */
  recordActivity(now: number): void {
    this._lastActivity = now;
    if (!this._isAutoAfk) {
      return;
    }
    this._isAutoAfk = false;
    const previous = this._statusBeforeAfk;
    this._statusBeforeAfk = undefined;
    if (isAutoAfkStatus(this._owner.status)) {
      this._owner.setStatus(isStatusActive(previous, now) ? previous : undefined);
    }
  }

  /**
   * Marks the player AFK if they have been idle long enough. A player who already set
   * themselves AFK is left as they are.
   */
  check(now: number): void {
    if (this._isAutoAfk || now - this._lastActivity < this._idleMs) {
      return;
    }
    const current = this._owner.status;
    if (current?.kind === 'AFK' && isStatusActive(current, now)) {
      return;
    }
    this._statusBeforeAfk = isStatusActive(current, now) ? current : undefined;
    this._isAutoAfk = true;
    this._owner.setStatus({ kind: 'AFK' });
  }
}
