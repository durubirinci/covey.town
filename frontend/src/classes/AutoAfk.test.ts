import AutoAfk, { AUTO_AFK_IDLE_MS, StatusOwner } from './AutoAfk';
import { PlayerStatus } from './PlayerStatus';

function makeOwner(initial?: PlayerStatus): StatusOwner & { setStatus: jest.Mock } {
  const owner = {
    status: initial,
    setStatus: jest.fn((newStatus: PlayerStatus | undefined) => {
      owner.status = newStatus;
    }),
  };
  return owner;
}

describe('AutoAfk', () => {
  const start = 1_000_000;
  it('does nothing before the player has been idle for 5 minutes', () => {
    const owner = makeOwner();
    const tracker = new AutoAfk(owner, start);
    tracker.check(start + AUTO_AFK_IDLE_MS - 1);
    expect(owner.setStatus).not.toHaveBeenCalled();
    expect(tracker.isAutoAfk).toBe(false);
  });
  it('marks the player AFK, with no end time, after 5 idle minutes', () => {
    const owner = makeOwner();
    const tracker = new AutoAfk(owner, start);
    tracker.check(start + AUTO_AFK_IDLE_MS);
    expect(owner.status).toEqual({ kind: 'AFK' });
    expect(tracker.isAutoAfk).toBe(true);
  });
  it('counts idle time from the last activity', () => {
    const owner = makeOwner();
    const tracker = new AutoAfk(owner, start);
    tracker.recordActivity(start + 60_000);
    tracker.check(start + AUTO_AFK_IDLE_MS);
    expect(owner.setStatus).not.toHaveBeenCalled();
    tracker.check(start + 60_000 + AUTO_AFK_IDLE_MS);
    expect(owner.status).toEqual({ kind: 'AFK' });
  });
  it('sets AFK only once while the player stays idle', () => {
    const owner = makeOwner();
    const tracker = new AutoAfk(owner, start);
    tracker.check(start + AUTO_AFK_IDLE_MS);
    tracker.check(start + 2 * AUTO_AFK_IDLE_MS);
    expect(owner.setStatus).toHaveBeenCalledTimes(1);
  });
  it('clears the AFK status when the player comes back with no earlier status', () => {
    const owner = makeOwner();
    const tracker = new AutoAfk(owner, start);
    tracker.check(start + AUTO_AFK_IDLE_MS);
    tracker.recordActivity(start + AUTO_AFK_IDLE_MS + 1000);
    expect(owner.status).toBeUndefined();
    expect(tracker.isAutoAfk).toBe(false);
  });
  it('puts the earlier status back when the player comes back before it ends', () => {
    const focused: PlayerStatus = { kind: 'Focused', expiresAt: start + 3_600_000 };
    const owner = makeOwner(focused);
    const tracker = new AutoAfk(owner, start);
    tracker.check(start + AUTO_AFK_IDLE_MS);
    expect(owner.status).toEqual({ kind: 'AFK' });
    tracker.recordActivity(start + AUTO_AFK_IDLE_MS + 1000);
    expect(owner.status).toBe(focused);
  });
  it('does not put back an earlier status that ended while the player was away', () => {
    const owner = makeOwner({ kind: 'On break', expiresAt: start + AUTO_AFK_IDLE_MS + 10_000 });
    const tracker = new AutoAfk(owner, start);
    tracker.check(start + AUTO_AFK_IDLE_MS);
    tracker.recordActivity(start + AUTO_AFK_IDLE_MS + 20_000);
    expect(owner.status).toBeUndefined();
  });
  it('does not put back an earlier status that had already ended when the player went AFK', () => {
    const owner = makeOwner({ kind: 'Focused', expiresAt: start + 1000 });
    const tracker = new AutoAfk(owner, start);
    tracker.check(start + AUTO_AFK_IDLE_MS);
    tracker.recordActivity(start + AUTO_AFK_IDLE_MS + 1000);
    expect(owner.status).toBeUndefined();
  });
  it('leaves a status the player set themselves while marked AFK', () => {
    const owner = makeOwner();
    const tracker = new AutoAfk(owner, start);
    tracker.check(start + AUTO_AFK_IDLE_MS);
    const picked: PlayerStatus = { kind: 'Focused', expiresAt: start + 3_600_000 };
    owner.setStatus(picked);
    tracker.recordActivity(start + AUTO_AFK_IDLE_MS + 1000);
    expect(owner.status).toBe(picked);
  });
  it('does not replace an AFK status the player set themselves', () => {
    const owner = makeOwner({ kind: 'AFK', expiresAt: start + 3_600_000 });
    const tracker = new AutoAfk(owner, start);
    tracker.check(start + AUTO_AFK_IDLE_MS);
    expect(owner.setStatus).not.toHaveBeenCalled();
    expect(tracker.isAutoAfk).toBe(false);
  });
});
