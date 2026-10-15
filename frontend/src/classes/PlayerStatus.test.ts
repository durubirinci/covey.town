import { formatPlayerStatus } from './PlayerStatus';

describe('formatPlayerStatus', () => {
  const now = 1_000_000;
  it('returns undefined when there is no status', () => {
    expect(formatPlayerStatus(undefined, now)).toBeUndefined();
  });
  it('returns undefined once the status has expired', () => {
    expect(formatPlayerStatus({ kind: 'AFK', expiresAt: now }, now)).toBeUndefined();
    expect(formatPlayerStatus({ kind: 'AFK', expiresAt: now - 1 }, now)).toBeUndefined();
  });
  it('shows minutes and seconds left', () => {
    expect(
      formatPlayerStatus({ kind: 'Focused', expiresAt: now + (24 * 60 + 13) * 1000 }, now),
    ).toBe('Focused 24:13');
  });
  it('rounds partial seconds up, so the countdown never shows 0:00 while still active', () => {
    expect(formatPlayerStatus({ kind: 'On break', expiresAt: now + 1 }, now)).toBe('On break 0:01');
  });
  it('shows hours when an hour or more is left', () => {
    expect(formatPlayerStatus({ kind: 'Focused', expiresAt: now + 3_600_000 }, now)).toBe(
      'Focused 1:00:00',
    );
  });
});
