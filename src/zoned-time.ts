// Wall-clock times in an IANA timezone, and the instants they name, using only `Intl`.
// Nothing here reads the machine's own timezone: every conversion names its zone.

/** A wall-clock time in some timezone, to the minute. `month` is 1–12. */
export interface WallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * How a wall time became an instant:
 * - `exact`: the wall time happens once.
 * - `skipped`: a DST change skips it (spring forward). It moves forward by the change,
 *   so 02:30 on a night that jumps from 02:00 to 03:00 becomes 03:30.
 * - `ambiguous`: a DST change repeats it (fall back). The earlier of the two is used.
 */
export type Resolution = 'exact' | 'skipped' | 'ambiguous';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** The zone's canonical IANA name, such as `Europe/Berlin` for `europe/berlin`, or null if it isn't one. */
export function canonicalTimeZone(timeZone: string): string | null {
  const name = timeZone.trim();
  if (name === '') return null;
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: name }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

/** The wall time, with seconds, that the instant shows in the zone. */
function partsAt(epochMs: number, timeZone: string): WallTime & { second: number } {
  const fields: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(epochMs)) {
    if (part.type !== 'literal') fields[part.type] = Number(part.value);
  }
  return {
    year: fields.year ?? NaN,
    month: fields.month ?? NaN,
    day: fields.day ?? NaN,
    // Some engines write midnight as 24 even under h23.
    hour: (fields.hour ?? NaN) % 24,
    minute: fields.minute ?? NaN,
    second: fields.second ?? NaN,
  };
}

/** The wall time the instant shows in the zone. */
export function wallTimeAt(instant: Date, timeZone: string): WallTime {
  const { year, month, day, hour, minute } = partsAt(instant.getTime(), timeZone);
  return { year, month, day, hour, minute };
}

/** The zone's offset from UTC at the instant, in milliseconds (positive east of UTC). */
function offsetAt(epochMs: number, timeZone: string): number {
  const whole = Math.floor(epochMs / 1000) * 1000;
  const p = partsAt(whole, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - whole;
}

/** The wall time read as if it were UTC, in milliseconds. */
export function wallAsUtc(wall: WallTime): number {
  return Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
}

/** True if the fields name a real calendar date and a time from 00:00 to 23:59. */
export function isValidWallTime(wall: WallTime): boolean {
  const { year, month, day, hour, minute } = wall;
  if (![year, month, day, hour, minute].every(Number.isInteger)) return false;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** The same wall time on the next calendar day. */
export function nextDay(wall: WallTime): WallTime {
  const date = new Date(wallAsUtc(wall) + DAY_MS);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: wall.hour,
    minute: wall.minute,
  };
}

/**
 * The instant at which the zone's clocks show the wall time. A time a DST change skips
 * moves forward by the change, and a time it repeats takes the earlier instant, as
 * Temporal's `compatible` disambiguation does.
 */
export function instantOf(wall: WallTime, timeZone: string): { instant: Date; resolution: Resolution } {
  const local = wallAsUtc(wall);
  // The offsets a day either side. Zones change offset at most once in two days, so
  // the instant, if there is one, uses one of these two.
  const before = offsetAt(local - DAY_MS, timeZone);
  const after = offsetAt(local + DAY_MS, timeZone);
  const matches = [...new Set([local - before, local - after])]
    .filter((epochMs) => wallAsUtc(wallTimeAt(new Date(epochMs), timeZone)) === local)
    .sort((a, b) => a - b);

  const [first] = matches;
  if (first === undefined) {
    // Skipped: read the wall time with the offset from before the change.
    return { instant: new Date(local - before), resolution: 'skipped' };
  }
  return { instant: new Date(first), resolution: matches.length > 1 ? 'ambiguous' : 'exact' };
}
