// The event's fields from text the user copied off an ra.co event page and pasted in.
// It reads only that text: nothing here, or anywhere in the app, fetches ra.co.
//
// An ra.co event page shows a breadcrumb (events, country, city), the title, then
// labelled blocks: `Venue` with the venue's name and address, `Date` with the day and
// the hours, and further down `Lineup`, `Genres` and others. Copied as text, each label
// and value lands on its own line. The reader below keys on those labels, and falls
// back to looking for a date and hours anywhere in the text.

import type { FieldName, FormFields } from './form';
import { isPlaceName, placeKey, zoneForPlace } from './time-zones';

/** What the user should check: a field the text didn't give, or gave in more than one way. */
export interface ExtractionNote {
  field: FieldName;
  kind: 'missing' | 'ambiguous';
  message: string;
}

export interface RaExtraction {
  /** The fields the text gave. A field it didn't give is absent. */
  fields: Partial<FormFields>;
  notes: ExtractionNote[];
}

export interface RaExtractOptions {
  /** Used for the timezone when the text names no place the app knows. */
  viewerTimeZone: string;
  /** Today, to choose the year of a date given without one. */
  now: Date;
}

type Section = 'venue' | 'date' | 'lineup' | 'other';

const LABELS: Record<string, Section> = {
  venue: 'venue',
  location: 'venue',
  date: 'date',
  dates: 'date',
  'date time': 'date',
  when: 'date',
  lineup: 'lineup',
  'line up': 'lineup',
  artists: 'lineup',
  promoter: 'other',
  promoters: 'other',
  cost: 'other',
  price: 'other',
  interested: 'other',
  attending: 'other',
  genres: 'other',
  genre: 'other',
  tickets: 'other',
  'buy tickets': 'other',
  'minimum age': 'other',
  'min age': 'other',
  admin: 'other',
  'event admin': 'other',
  'ra pick': 'other',
  share: 'other',
  save: 'other',
  report: 'other',
  'about this event': 'other',
  'more events': 'other',
  'similar events': 'other',
};

/** Lines that are the page's furniture and never the event's title. */
const NOT_TITLES = new Set(['events', 'event', 'ra', 'resident advisor', 'tickets', 'buy tickets', 'ra pick', 'interested', 'going', 'share', 'save', 'tba']);

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const WEEKDAYS: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

const WEEKDAY = String.raw`(?:(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b\.?,?\s+)?`;
const MONTH = String.raw`(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b\.?`;
const ORDINAL = String.raw`(?:st|nd|rd|th)?`;
// `Sat, 18 Jul 2026`, `Saturday 18 July`, `Sat, Jul 18, 2026`, `18.07.2026` and `2026-07-18`.
const DATE_PATTERNS: { pattern: RegExp; read: (m: RegExpExecArray) => PartialDate }[] = [
  {
    pattern: new RegExp(String.raw`\b${WEEKDAY}(\d{1,2})${ORDINAL}\s+${MONTH},?(?:\s+(\d{4}))?\b`, 'gi'),
    read: (m) => partial(m[1], m[3], m[2], m[4]),
  },
  {
    pattern: new RegExp(String.raw`\b${WEEKDAY}${MONTH}\s+(\d{1,2})${ORDINAL},?(?:\s+(\d{4}))?\b`, 'gi'),
    read: (m) => partial(m[1], m[2], m[3], m[4]),
  },
  {
    pattern: /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    read: (m) => ({ year: Number(m[1]), month: Number(m[2]), day: Number(m[3]), weekday: null }),
  },
  {
    pattern: /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g,
    read: (m) => ({ year: Number(m[3]), month: Number(m[2]), day: Number(m[1]), weekday: null }),
  },
];

// `23:00`, `23.00`, `11pm`, `11:30 PM`. A bare number isn't a time.
const TIME = String.raw`(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?\s*m\b\.?|(\d{1,2})[:.](\d{2})`;
const TIME_RANGE = new RegExp(String.raw`(?:${TIME})\s*(?:-|–|—|to|until|till)\s*(?:${TIME})`, 'i');
const SINGLE_TIME = new RegExp(TIME, 'i');

const SOURCE = /\b(?:https?:\/\/)?(?:www\.)?(?:ra\.co|residentadvisor\.net)\/events\/(?:[a-z]{2}\/)?(\d+)/gi;

interface PartialDate {
  year: number | null;
  month: number;
  day: number;
  weekday: number | null;
}

interface FullDate {
  year: number;
  month: number;
  day: number;
}

function partial(weekday: string | undefined, month: string | undefined, day: string | undefined, year: string | undefined): PartialDate {
  return {
    year: year === undefined ? null : Number(year),
    month: MONTHS[(month ?? '').toLowerCase().slice(0, 3)] ?? NaN,
    day: Number(day),
    weekday: weekday === undefined ? null : (WEEKDAYS[weekday.toLowerCase().slice(0, 3)] ?? null),
  };
}

function weekdayOf(date: FullDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

function isRealDate(date: FullDate): boolean {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return utc.getUTCFullYear() === date.year && utc.getUTCMonth() === date.month - 1 && utc.getUTCDate() === date.day;
}

function iso(date: FullDate): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

function dateMatches(text: string): { index: number; end: number; date: PartialDate }[] {
  const found: { index: number; end: number; date: PartialDate }[] = [];
  const taken: [number, number][] = [];
  for (const { pattern, read } of DATE_PATTERNS) {
    pattern.lastIndex = 0;
    for (let m = pattern.exec(text); m !== null; m = pattern.exec(text)) {
      const end = m.index + m[0].length;
      if (taken.some(([a, b]) => m!.index < b && end > a)) continue;
      const date = read(m);
      if (!Number.isInteger(date.month) || !Number.isInteger(date.day)) continue;
      taken.push([m.index, end]);
      found.push({ index: m.index, end, date });
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

function datesIn(text: string): PartialDate[] {
  return dateMatches(text).map(({ date }) => date);
}

/** The text with its dates blanked out, so `18.07.2026` isn't read as the time 18:07. */
function withoutDates(text: string): string {
  let result = text;
  for (const { index, end } of dateMatches(text)) {
    result = result.slice(0, index) + ' '.repeat(end - index) + result.slice(end);
  }
  return result;
}

/** `HH:mm` from a matched time's groups: 12-hour (hour, minute, a/p) or 24-hour (hour, minute). */
function readTime(groups: (string | undefined)[]): string | null {
  const [h12, m12, ampm, h24, m24] = groups;
  let hour: number;
  let minute: number;
  if (ampm !== undefined) {
    hour = Number(h12) % 12 + (ampm.toLowerCase() === 'p' ? 12 : 0);
    minute = m12 === undefined ? 0 : Number(m12);
    if (Number(h12) < 1 || Number(h12) > 12) return null;
  } else {
    hour = Number(h24);
    minute = Number(m24);
  }
  if (!(hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function cleanLines(text: string): string[] {
  return text
    .replace(/[​-‍﻿]/g, '')
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim());
}

function labelOf(line: string): Section | null {
  const key = placeKey(line.replace(/:$/, ''));
  return LABELS[key] ?? null;
}

/** The non-blank lines after each label, up to the next label. */
function sections(lines: readonly string[]): { label: Section; index: number; lines: string[] }[] {
  const found: { label: Section; index: number; lines: string[] }[] = [];
  lines.forEach((line, index) => {
    const label = labelOf(line);
    if (label !== null) found.push({ label, index, lines: [] });
    else if (line !== '' && found.length > 0) found[found.length - 1]!.lines.push(line);
  });
  return found;
}

function isFurniture(line: string): boolean {
  const key = placeKey(line);
  return (
    key === '' ||
    NOT_TITLES.has(key) ||
    isPlaceName(line) ||
    /^events?\b.*[/›>»|]/i.test(line) ||
    /^(?:https?:\/\/|www\.|ra\.co)/i.test(line) ||
    /^[\d.,]+\s*k?$/i.test(line)
  );
}

/** Chooses the year of a date given without one: the year whose weekday matches, or the next one to come. */
function withYear(date: PartialDate, now: Date): { date: FullDate; guessed: boolean } {
  if (date.year !== null) return { date: { ...date, year: date.year }, guessed: false };
  const thisYear = now.getUTCFullYear();
  const candidates = [thisYear, thisYear + 1].map((year) => ({ year, month: date.month, day: date.day }));
  if (date.weekday !== null) {
    const matching = candidates.filter((c) => isRealDate(c) && weekdayOf(c) === date.weekday);
    if (matching.length === 1) return { date: matching[0]!, guessed: false };
  }
  const yesterday = Date.UTC(thisYear, now.getUTCMonth(), now.getUTCDate() - 1);
  const upcoming = candidates.find((c) => Date.UTC(c.year, c.month - 1, c.day) >= yesterday) ?? candidates[1]!;
  return { date: upcoming, guessed: true };
}

function sameDate(a: FullDate, b: FullDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Reads what it can of an event from text pasted from an ra.co event page. */
export function extractFromRaText(text: string, options: RaExtractOptions): RaExtraction {
  const fields: Partial<FormFields> = {};
  const notes: ExtractionNote[] = [];
  const note = (field: FieldName, kind: ExtractionNote['kind'], message: string): void => {
    notes.push({ field, kind, message });
  };

  const lines = cleanLines(text);
  const found = sections(lines);
  const first = (label: Section) => found.find((s) => s.label === label);
  const firstLabelIndex = found[0]?.index ?? lines.length;

  // The source: the event's page on ra.co, or on its old domain.
  const ids = [...new Set([...text.matchAll(SOURCE)].map((m) => m[1]))];
  if (ids.length > 0) fields.sourceUrl = `https://ra.co/events/${ids[0]}`;
  if (ids.length === 0) {
    note('sourceUrl', 'missing', 'The text has no ra.co event link. Paste the event page’s address, if you want the entry to link to it.');
  } else if (ids.length > 1) {
    note('sourceUrl', 'ambiguous', `The text links ${ids.length} ra.co events. The first, ${fields.sourceUrl}, is used.`);
  }

  // The title: the nearest line above the first label that isn't the page's furniture.
  const header = lines.slice(0, firstLabelIndex);
  // With no labels, the text isn't laid out as a page, and its first line is the likeliest title.
  const candidates = found.length === 0 ? header : [...header].reverse();
  const title = candidates.find((line) => !isFurniture(line) && line.length <= 150 && datesIn(line).length === 0);
  if (title !== undefined) {
    fields.title = title;
    if (found.length === 0) note('title', 'ambiguous', 'The text doesn’t look like an ra.co event page, so the title is its first line. Check it.');
  } else {
    note('title', 'missing', 'The text has no title the app could find.');
  }

  // The venue: its name, then its address, which ra.co splits with semicolons.
  const venueLines = (first('venue')?.lines ?? []).filter((line) => datesIn(line).length === 0 && !TIME_RANGE.test(line)).slice(0, 3);
  const venueText = venueLines.flatMap((line) => line.split(/\s*;\s*/)).filter((part) => part !== '').join(', ');
  const announced = !/^(?:tba|tbc|tbd|to be announced|secret location)$/i.test(venueLines[0] ?? '');
  if (venueText !== '' && announced) {
    fields.venue = venueText;
  } else {
    note('venue', 'missing', venueText === '' ? 'The text has no venue.' : 'The venue is still to be announced.');
  }

  // The timezone, from the venue's address first and then the breadcrumb.
  const zone = zoneForPlace([venueText, ...header]);
  if (zone.kind === 'found') {
    fields.timeZone = zone.timeZone;
  } else {
    fields.timeZone = options.viewerTimeZone;
    note(
      'timeZone',
      zone.kind === 'several' ? 'ambiguous' : 'missing',
      zone.kind === 'several'
        ? `The venue is in a country with several timezones, and the app doesn’t know its city. Your own, ${options.viewerTimeZone}, is filled in: choose the event’s.`
        : `The text names no place the app knows the timezone of. Your own, ${options.viewerTimeZone}, is filled in: check it.`,
    );
  }

  // The date and the hours: from the Date block, or anywhere if there isn't one.
  const dateBlock = first('date');
  const dateText = dateBlock ? dateBlock.lines.slice(0, 4).join('\n') : lines.join('\n');
  const dates = datesIn(dateText);
  const timeText = withoutDates(dateText);
  const range = TIME_RANGE.exec(timeText);
  const startTime = range ? readTime(range.slice(1, 6)) : (() => {
    const single = SINGLE_TIME.exec(timeText);
    return single ? readTime(single.slice(1, 6)) : null;
  })();
  const endTime = range ? readTime(range.slice(6, 11)) : null;

  const [firstDate, secondDate] = dates;
  if (firstDate === undefined) {
    note('start', 'missing', 'The text has no date the app could read.');
  } else {
    const start = withYear(firstDate, options.now);
    if (!isRealDate(start.date)) {
      note('start', 'ambiguous', 'The date in the text isn’t a real date. Check it.');
    } else if (startTime === null) {
      note('start', 'missing', `The text gives the date, ${iso(start.date)}, but no start time.`);
    } else {
      fields.start = `${iso(start.date)}T${startTime}`;
      if (start.guessed) note('start', 'ambiguous', `The date has no year, so ${start.date.year} is used. Check it.`);
      else if (firstDate.weekday !== null && firstDate.weekday !== weekdayOf(start.date)) {
        note('start', 'ambiguous', 'The weekday in the text doesn’t match the date. Check which is right.');
      }
    }

    if (secondDate !== undefined) {
      // An end with no year is in the start's year, or the next one if that would put it first.
      let end: FullDate = { ...secondDate, year: secondDate.year ?? start.date.year };
      if (secondDate.year === null && iso(end) < iso(start.date)) end = { ...end, year: end.year + 1 };
      if (isRealDate(end) && !sameDate(end, start.date)) fields.endDate = iso(end);
    }
    const distinct = new Set(dates.map((d) => `${d.year}-${d.month}-${d.day}`));
    if (distinct.size > 2) note('start', 'ambiguous', `The text gives ${distinct.size} dates. The first two are used as the start and the end.`);
  }

  if (endTime !== null) fields.endTime = endTime;
  else if (fields.endDate !== undefined) {
    note('endTime', 'missing', 'The text gives an end date but no end time.');
    delete fields.endDate;
  }

  // The lineup: one name to a line, or names separated by commas, up to the next label.
  const lineupLines = (first('lineup')?.lines ?? []).filter(
    (line) => line.length <= 100 && !/(?:ra\.co|residentadvisor\.net)\/|^(?:https?:\/\/|www\.)/i.test(line),
  );
  const names = lineupLines.flatMap((line) => line.split(/\s*,\s*|\s+·\s+/)).filter((name) => name !== '');
  if (names.length > 0) {
    fields.lineup = names.join('\n');
  } else {
    note('lineup', 'missing', 'The text has no lineup.');
  }

  return { fields, notes };
}
