// An iCalendar file (RFC 5545) with the one event, for Google Calendar, Apple Calendar
// and anything else that imports `.ics`.

import type { CalendarEvent } from './event';
import { eventDetails, utcStamp } from './format';

export interface IcsOptions {
  /** The event's globally unique id, such as `<uuid>@mawzikalendar.eigenomar.com`. */
  uid: string;
  /** When the file is made, for `DTSTAMP`. */
  now: Date;
}

const PRODID = '-//eigenomar//mawzikalendar//EN';
const MAX_LINE_OCTETS = 75;
const encoder = new TextEncoder();

/** A TEXT value, escaped as RFC 5545 §3.3.11 says. */
export function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * The line folded at 75 octets of UTF-8, as RFC 5545 §3.1 says: each continuation
 * starts with a space, and no character is split across lines.
 */
export function foldLine(line: string): string {
  const lines: string[] = [];
  let current = '';
  let octets = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (octets + size > MAX_LINE_OCTETS) {
      lines.push(current);
      current = ' ';
      octets = 1;
    }
    current += char;
    octets += size;
  }
  lines.push(current);
  return lines.join('\r\n');
}

/**
 * The `.ics` text, with CRLF line endings. Times are in UTC, so the file needs no
 * VTIMEZONE and every calendar places the event at the same instant.
 */
export function toIcs(event: CalendarEvent, options: IcsOptions): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${options.uid}`,
    `DTSTAMP:${utcStamp(options.now)}`,
    `DTSTART:${utcStamp(event.start)}`,
    `DTEND:${utcStamp(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];
  if (event.venue !== null) lines.push(`LOCATION:${escapeText(event.venue)}`);
  const details = eventDetails(event);
  if (details !== '') lines.push(`DESCRIPTION:${escapeText(details)}`);
  // A URI value isn't escaped, and normalization has already made it a valid URL.
  if (event.sourceUrl !== null) lines.push(`URL:${event.sourceUrl}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

/** `2026-07-18-night-at-the-club.ics`: the start's date on the event's clocks, and the title. */
export function icsFileName(event: CalendarEvent): string {
  const { year, month, day } = event.startLocal;
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const slug = event.title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return slug === '' ? `${date}-event.ics` : `${date}-${slug}.ics`;
}
