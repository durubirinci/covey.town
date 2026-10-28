import AutoAfk, { AUTO_AFK_IDLE_MS, StatusOwner } from './AutoAfk';
import { PlayerStatus } from './PlayerStatus';

function makeOwner(initial?: PlayerStatus): StatusOwner & { setStatus: jest.Mock } {
  const owner = {
    status: initial,
    setStatus: jest.fn((newStatus: PlayerStatus) => {
      owner.status = newStatus;
    }),
  };
  return owner;
}

describe('AutoAfk', () => {
  const start = 1_000_000;
  const idleAt = start + AUTO_AFK_IDLE_MS;
  describe('when the player is idle', () => {
    it('does nothing before 5 idle minutes', () => {
      const owner = makeOwner();
      new AutoAfk(owner, start).check(idleAt - 1);
      expect(owner.setStatus).not.toHaveBeenCalled();
    });
    it('marks an Active player AFK after 5 idle minutes', () => {
      const owner = makeOwner({ kind: 'Active' });
      new AutoAfk(owner, start).check(idleAt);
      expect(owner.status).toEqual({ kind: 'AFK' });
    });
    it('treats a player with no status yet as Active', () => {
      const owner = makeOwner();
      new AutoAfk(owner, start).check(idleAt);
      expect(owner.status).toEqual({ kind: 'AFK' });
    });
    it('marks a Focused player AFK after 5 idle minutes', () => {
      const owner = makeOwner({ kind: 'Focused', expiresAt: start + 3_600_000 });
      new AutoAfk(owner, start).check(idleAt);
      expect(owner.status).toEqual({ kind: 'AFK' });
    });
    it('leaves an Away player alone while their timer runs', () => {
      const owner = makeOwner({ kind: 'Away', expiresAt: start + 3_600_000 });
      new AutoAfk(owner, start).check(idleAt);
      expect(owner.setStatus).not.toHaveBeenCalled();
    });
    it('counts idle time from the last activity', () => {
      const owner = makeOwner();
      const tracker = new AutoAfk(owner, start);
      tracker.recordActivity(start + 60_000);
      tracker.check(idleAt);
      expect(owner.setStatus).not.toHaveBeenCalled();
      tracker.check(idleAt + 60_000);
      expect(owner.status).toEqual({ kind: 'AFK' });
    });
    it('sets AFK only once while the player stays idle', () => {
      const owner = makeOwner();
      const tracker = new AutoAfk(owner, start);
      tracker.check(idleAt);
      tracker.check(idleAt + AUTO_AFK_IDLE_MS);
      expect(owner.setStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the player comes back', () => {
    it('brings an AFK player back to Active', () => {
      const owner = makeOwner();
      const tracker = new AutoAfk(owner, start);
      tracker.check(idleAt);
      tracker.recordActivity(idleAt + 1000);
      expect(owner.status).toEqual({ kind: 'Active' });
    });
    it('leaves a Focused or Away player as they are', () => {
      const focused: PlayerStatus = { kind: 'Focused', expiresAt: start + 3_600_000 };
      const owner = makeOwner(focused);
      new AutoAfk(owner, start).recordActivity(start + 1000);
      expect(owner.setStatus).not.toHaveBeenCalled();
    });
  });

  describe('when a timer ends', () => {
    it('makes a Focused player Active', () => {
      const owner = makeOwner({ kind: 'Focused', expiresAt: start + 60_000 });
      new AutoAfk(owner, start).check(start + 60_000);
      expect(owner.status).toEqual({ kind: 'Active' });
    });
    it('makes an Away player AFK if they have been idle', () => {
      const owner = makeOwner({ kind: 'Away', expiresAt: start + 15 * 60_000 });
      new AutoAfk(owner, start).check(start + 15 * 60_000);
      expect(owner.status).toEqual({ kind: 'AFK' });
    });
    it('makes an Away player Active if they came back before it ended', () => {
      const owner = makeOwner({ kind: 'Away', expiresAt: start + 15 * 60_000 });
      const tracker = new AutoAfk(owner, start);
      tracker.recordActivity(start + 14 * 60_000);
      tracker.check(start + 15 * 60_000);
      expect(owner.status).toEqual({ kind: 'Active' });
    });
  });
});
