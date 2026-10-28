import {
  createPlayerStatus,
  formatPlayerStatus,
  isStatusActive,
  MAX_WORKING_ON_LENGTH,
} from './PlayerStatus';

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

describe('formatPlayerStatus with no expiry or a working-on line', () => {
  const now = 1_000_000;
  it('shows a status with no expiry time without a countdown', () => {
    expect(formatPlayerStatus({ kind: 'AFK' }, now)).toBe('AFK');
  });
  it('adds what the player is working on as a second line', () => {
    expect(
      formatPlayerStatus({ kind: 'Focused', expiresAt: now + 60_000, workingOn: 'CS490 HW3' }, now),
    ).toBe('Focused 1:00\nCS490 HW3');
  });
  it('leaves out a blank working-on line', () => {
    expect(formatPlayerStatus({ kind: 'AFK', workingOn: '   ' }, now)).toBe('AFK');
  });
});

describe('isStatusActive', () => {
  const now = 1_000_000;
  it('is false with no status or an expired one, true otherwise', () => {
    expect(isStatusActive(undefined, now)).toBe(false);
    expect(isStatusActive({ kind: 'AFK', expiresAt: now }, now)).toBe(false);
    expect(isStatusActive({ kind: 'AFK', expiresAt: now + 1 }, now)).toBe(true);
    expect(isStatusActive({ kind: 'AFK' }, now)).toBe(true);
  });
});

describe('createPlayerStatus', () => {
  const now = 1_000_000;
  it('sets the expiry time from the duration in minutes', () => {
    expect(createPlayerStatus('On break', 15, now)).toEqual({
      kind: 'On break',
      expiresAt: now + 15 * 60_000,
    });
  });
  it('trims the working-on text and drops it when blank', () => {
    expect(createPlayerStatus('Focused', 25, now, '  HW3  ').workingOn).toBe('HW3');
    expect(createPlayerStatus('Focused', 25, now, '   ')).not.toHaveProperty('workingOn');
  });
  it('cuts working-on text longer than the limit', () => {
    const status = createPlayerStatus('Focused', 25, now, 'x'.repeat(MAX_WORKING_ON_LENGTH + 10));
    expect(status.workingOn).toHaveLength(MAX_WORKING_ON_LENGTH);
  });
});
