import { createTimedStatus, formatPlayerStatus, isStatusExpired } from './PlayerStatus';

describe('formatPlayerStatus', () => {
  const now = 1_000_000;
  it('returns undefined for an Active player', () => {
    expect(formatPlayerStatus(undefined, now)).toBeUndefined();
    expect(formatPlayerStatus({ kind: 'Active' }, now)).toBeUndefined();
  });
  it('returns undefined once a timed status has expired', () => {
    expect(formatPlayerStatus({ kind: 'Away', expiresAt: now }, now)).toBeUndefined();
    expect(formatPlayerStatus({ kind: 'Away', expiresAt: now - 1 }, now)).toBeUndefined();
  });
  it('shows minutes and seconds left', () => {
    expect(
      formatPlayerStatus({ kind: 'Focused', expiresAt: now + (24 * 60 + 13) * 1000 }, now),
    ).toBe('Focused 24:13');
  });
  it('rounds partial seconds up, so the countdown never shows 0:00 while still active', () => {
    expect(formatPlayerStatus({ kind: 'Away', expiresAt: now + 1 }, now)).toBe('Away 0:01');
  });
  it('shows hours when an hour or more is left', () => {
    expect(formatPlayerStatus({ kind: 'Focused', expiresAt: now + 3_600_000 }, now)).toBe(
      'Focused 1:00:00',
    );
  });
  it('shows AFK without a countdown', () => {
    expect(formatPlayerStatus({ kind: 'AFK' }, now)).toBe('AFK');
  });
});

describe('isStatusExpired', () => {
  const now = 1_000_000;
  it('is true only for a timed status whose end time has passed', () => {
    expect(isStatusExpired(undefined, now)).toBe(false);
    expect(isStatusExpired({ kind: 'AFK' }, now)).toBe(false);
    expect(isStatusExpired({ kind: 'Away', expiresAt: now + 1 }, now)).toBe(false);
    expect(isStatusExpired({ kind: 'Away', expiresAt: now }, now)).toBe(true);
  });
});

describe('createTimedStatus', () => {
  it('sets the end time from the duration in minutes', () => {
    expect(createTimedStatus('Away', 15, 1_000_000)).toEqual({
      kind: 'Away',
      expiresAt: 1_000_000 + 15 * 60_000,
    });
  });
});
