// The event model, and the normalization that turns what the user entered into it.

import {
  canonicalTimeZone,
  instantOf,
  isValidWallTime,
  nextDay,
  wallTimeAt,
  type Resolution,
  type WallTime,
} from './zoned-time';

/** An event as entered, before it is checked. Times are wall-clock times in `timeZone`. */
export interface EventDraft {
  title: string;
  /** `YYYY-MM-DDTHH:mm`, as a `datetime-local` input gives it. */
  start: string;
  /**
   * `YYYY-MM-DDTHH:mm`, or `HH:mm` for a time on the start's day, or on the next day
   * when it isn't after the start, as with 23:00 to 06:00. Empty or absent if unknown.
   */
  end?: string;
  /** The event's own IANA timezone, such as `Europe/Berlin`, which may differ from the user's. */
  timeZone: string;
  venue?: string;
  lineup?: readonly string[];
  sourceUrl?: string;
  notes?: string;
}

/** Something normalization worked out or guessed, for the review screen to show. */
export type EventFlag =
  /** There was no end time, so the end is the start plus the default duration. */
  | 'end-defaulted'
  /** The start falls in a DST gap and was moved forward by the change. */
  | 'start-skipped'
  /** The start happens twice in a DST overlap, and the earlier one was used. */
  | 'start-ambiguous'
  /** The end falls in a DST gap and was moved forward by the change. */
  | 'end-skipped'
  /** The end happens twice in a DST overlap, and the earlier one was used. */
  | 'end-ambiguous';

/** Why a draft can't become an event. */
export type EventError =
  | 'title-missing'
  | 'start-invalid'
  | 'time-zone-invalid'
  | 'end-invalid'
  | 'end-not-after-start'
  | 'source-url-invalid';

/** A normalized event: its start and end are instants, and the rest is trimmed. */
export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  /** The canonical IANA name of the event's timezone. */
  timeZone: string;
  /** The start and end as the event's own clocks show them. */
  startLocal: WallTime;
  endLocal: WallTime;
  /** True when the event ends on a later calendar day than it starts, in its own timezone. */
  overnight: boolean;
  venue: string | null;
  lineup: string[];
  sourceUrl: string | null;
  notes: string | null;
  flags: EventFlag[];
}

export type NormalizeResult =
  | { ok: true; event: CalendarEvent }
  | { ok: false; errors: EventError[] };

export interface NormalizeOptions {
  /** The duration given to an event with no end time, in minutes. */
  defaultDurationMinutes?: number;
}

/** Four hours, a typical club or concert night, when the event gives no end. */
export const DEFAULT_DURATION_MINUTES = 240;

const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const TIME = /^(\d{2}):(\d{2})$/;

function parseDateTime(text: string): WallTime | null {
  const match = DATE_TIME.exec(text.trim());
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number) as [number, number, number, number, number];
  const wall = { year, month, day, hour, minute };
  return isValidWallTime(wall) ? wall : null;
}

function parseTimeOn(text: string, date: WallTime): WallTime | null {
  const match = TIME.exec(text.trim());
  if (!match) return null;
  const wall = { ...date, hour: Number(match[1]), minute: Number(match[2]) };
  return isValidWallTime(wall) ? wall : null;
}

function optionalText(text: string | undefined): string | null {
  const trimmed = text?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

/** The names, trimmed, without blanks, and without repeats that differ only in case. */
function normalizeLineup(lineup: readonly string[] | undefined): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of lineup ?? []) {
    const name = raw.trim();
    const key = name.toLocaleLowerCase();
    if (name === '' || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

function normalizeUrl(text: string | undefined): { url: string | null; valid: boolean } {
  const trimmed = optionalText(text);
  if (trimmed === null) return { url: null, valid: true };
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? { url: url.href, valid: true }
      : { url: null, valid: false };
  } catch {
    return { url: null, valid: false };
  }
}

const SKIPPED_FLAG = { start: 'start-skipped', end: 'end-skipped' } as const;
const AMBIGUOUS_FLAG = { start: 'start-ambiguous', end: 'end-ambiguous' } as const;

function flagFor(which: 'start' | 'end', resolution: Resolution): EventFlag | null {
  if (resolution === 'skipped') return SKIPPED_FLAG[which];
  if (resolution === 'ambiguous') return AMBIGUOUS_FLAG[which];
  return null;
}

/**
 * Checks a draft and turns it into an event, or says everything that is wrong with it.
 * An end before the start on the same day is taken as the next day, a missing end gets
 * the default duration and the `end-defaulted` flag, and times a DST change skips or
 * repeats are resolved and flagged.
 */
export function normalizeEvent(draft: EventDraft, options: NormalizeOptions = {}): NormalizeResult {
  const errors: EventError[] = [];

  const title = optionalText(draft.title);
  if (title === null) errors.push('title-missing');

  const timeZone = canonicalTimeZone(draft.timeZone);
  if (timeZone === null) errors.push('time-zone-invalid');

  const startWall = parseDateTime(draft.start);
  if (startWall === null) errors.push('start-invalid');

  const endText = optionalText(draft.end);
  const endIsTime = endText !== null && TIME.test(endText);
  let endWall: WallTime | null = null;
  if (endText !== null) {
    endWall = endIsTime ? (startWall && parseTimeOn(endText, startWall)) : parseDateTime(endText);
    // A time alone can't be checked without a valid start, which is already reported.
    if (endWall === null && !(endIsTime && startWall === null)) errors.push('end-invalid');
  }

  const source = normalizeUrl(draft.sourceUrl);
  if (!source.valid) errors.push('source-url-invalid');

  if (title === null || timeZone === null || startWall === null || (endText !== null && endWall === null)) {
    return { ok: false, errors };
  }

  const flags: EventFlag[] = [];
  const start = instantOf(startWall, timeZone);
  const startFlag = flagFor('start', start.resolution);
  if (startFlag) flags.push(startFlag);

  let end: Date;
  if (endWall === null) {
    const minutes = options.defaultDurationMinutes ?? DEFAULT_DURATION_MINUTES;
    end = new Date(start.instant.getTime() + minutes * 60_000);
    flags.push('end-defaulted');
  } else {
    let resolved = instantOf(endWall, timeZone);
    if (endIsTime && resolved.instant.getTime() <= start.instant.getTime()) {
      resolved = instantOf(nextDay(endWall), timeZone);
    }
    if (resolved.instant.getTime() <= start.instant.getTime()) {
      return { ok: false, errors: [...errors, 'end-not-after-start'] };
    }
    end = resolved.instant;
    const endFlag = flagFor('end', resolved.resolution);
    if (endFlag) flags.push(endFlag);
  }

  if (errors.length > 0) return { ok: false, errors };

  const startLocal = wallTimeAt(start.instant, timeZone);
  const endLocal = wallTimeAt(end, timeZone);
  const overnight =
    Date.UTC(endLocal.year, endLocal.month - 1, endLocal.day) >
    Date.UTC(startLocal.year, startLocal.month - 1, startLocal.day);

  return {
    ok: true,
    event: {
      title,
      start: start.instant,
      end,
      timeZone,
      startLocal,
      endLocal,
      overnight,
      venue: optionalText(draft.venue),
      lineup: normalizeLineup(draft.lineup),
      sourceUrl: source.url,
      notes: optionalText(draft.notes),
      flags,
    },
  };
}
