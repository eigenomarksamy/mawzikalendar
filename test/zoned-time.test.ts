import { describe, expect, it } from 'vitest';
import { canonicalTimeZone, instantOf, isValidWallTime, nextDay, wallTimeAt } from '../src/zoned-time';

const at = (year: number, month: number, day: number, hour = 0, minute = 0) => ({ year, month, day, hour, minute });

describe('instantOf', () => {
  it('converts a time that happens once', () => {
    const { instant, resolution } = instantOf(at(2026, 1, 15, 20), 'Europe/Berlin');
    expect(instant.toISOString()).toBe('2026-01-15T19:00:00.000Z');
    expect(resolution).toBe('exact');
  });

  it('moves a time a DST change skips forward by the change', () => {
    const { instant, resolution } = instantOf(at(2026, 3, 8, 2, 30), 'America/New_York');
    expect(instant.toISOString()).toBe('2026-03-08T07:30:00.000Z');
    expect(wallTimeAt(instant, 'America/New_York')).toEqual(at(2026, 3, 8, 3, 30));
    expect(resolution).toBe('skipped');
  });

  it('takes the earlier of a time a DST change repeats', () => {
    const { instant, resolution } = instantOf(at(2026, 11, 1, 1, 30), 'America/New_York');
    expect(instant.toISOString()).toBe('2026-11-01T05:30:00.000Z');
    expect(resolution).toBe('ambiguous');
  });

  it('handles a zone with a half-hour offset and no DST', () => {
    expect(instantOf(at(2026, 7, 1, 21), 'Asia/Kolkata').instant.toISOString()).toBe('2026-07-01T15:30:00.000Z');
  });

  it('round-trips every hour of a year that crosses both changes', () => {
    for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += 3_600_000) {
      const wall = wallTimeAt(new Date(t), 'Europe/Berlin');
      const { instant, resolution } = instantOf(wall, 'Europe/Berlin');
      // The repeated hour maps back to its first instance.
      if (resolution === 'ambiguous') expect(t - instant.getTime()).toBeLessThanOrEqual(3_600_000);
      else expect(instant.getTime()).toBe(t);
    }
  });
});

describe('canonicalTimeZone', () => {
  it('names a zone canonically, and rejects what isn’t one', () => {
    expect(canonicalTimeZone('asia/tokyo')).toBe('Asia/Tokyo');
    expect(canonicalTimeZone('UTC')).toBe('UTC');
    expect(canonicalTimeZone('Mars/Olympus')).toBeNull();
    expect(canonicalTimeZone('')).toBeNull();
  });
});

describe('isValidWallTime and nextDay', () => {
  it('knows leap days and the range of a day', () => {
    expect(isValidWallTime(at(2028, 2, 29))).toBe(true);
    expect(isValidWallTime(at(2026, 2, 29))).toBe(false);
    expect(isValidWallTime(at(2026, 7, 18, 23, 59))).toBe(true);
    expect(isValidWallTime(at(2026, 7, 18, 24, 0))).toBe(false);
  });

  it('rolls over months and years', () => {
    expect(nextDay(at(2026, 2, 28, 6))).toEqual(at(2026, 3, 1, 6));
    expect(nextDay(at(2026, 12, 31, 4, 15))).toEqual(at(2027, 1, 1, 4, 15));
  });
});
