// How an event reads as text: its dates and times, the summary to copy, and the
// description the Google link and the `.ics` carry. Dates are spelled out here rather
// than through `Intl`'s locale data, so the text is the same in every browser.

import type { CalendarEvent } from './event';
import { wallTimeAt, type WallTime } from './zoned-time';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `Sat 18 Jul 2026`. */
export function formatDate(wall: WallTime): string {
  const weekday = WEEKDAYS[new Date(Date.UTC(wall.year, wall.month - 1, wall.day)).getUTCDay()];
  return `${weekday} ${wall.day} ${MONTHS[wall.month - 1]} ${wall.year}`;
}

/** `23:00`. */
export function formatTime(wall: WallTime): string {
  return `${pad(wall.hour)}:${pad(wall.minute)}`;
}

function sameDay(a: WallTime, b: WallTime): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** `Sat 18 Jul 2026, 19:00–23:30`, or `Sat 18 Jul 2026, 23:00 – Sun 19 Jul 2026, 06:00`. */
export function formatRange(start: WallTime, end: WallTime): string {
  return sameDay(start, end)
    ? `${formatDate(start)}, ${formatTime(start)}–${formatTime(end)}`
    : `${formatDate(start)}, ${formatTime(start)} – ${formatDate(end)}, ${formatTime(end)}`;
}

/** When the event is, on its own clocks, with its zone. */
export function eventWhen(event: CalendarEvent): string {
  return `${formatRange(event.startLocal, event.endLocal)} (${event.timeZone})`;
}

/** When the event is on another zone's clocks, such as the viewer's. */
export function eventWhenIn(event: CalendarEvent, timeZone: string): string {
  return `${formatRange(wallTimeAt(event.start, timeZone), wallTimeAt(event.end, timeZone))} (${timeZone})`;
}

/** An instant in UTC, as iCalendar and Google's links write it: `20260718T210000Z`. */
export function utcStamp(instant: Date): string {
  return instant.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[-:]/g, '');
}

const END_ASSUMED = 'End time assumed: the event didn’t give one.';

/** The description a calendar entry carries: the lineup, the notes and the source. */
export function eventDetails(event: CalendarEvent): string {
  const parts: string[] = [];
  if (event.lineup.length > 0) parts.push(`Lineup: ${event.lineup.join(', ')}`);
  if (event.notes !== null) parts.push(event.notes);
  if (event.flags.includes('end-defaulted')) parts.push(END_ASSUMED);
  if (event.sourceUrl !== null) parts.push(event.sourceUrl);
  return parts.join('\n\n');
}

/** The plain-text summary to copy. */
export function eventSummary(event: CalendarEvent): string {
  const assumed = event.flags.includes('end-defaulted') ? ', end time assumed' : '';
  const lines = [event.title, `${eventWhen(event)}${assumed}`];
  if (event.venue !== null) lines.push(`Venue: ${event.venue}`);
  if (event.lineup.length > 0) lines.push(`Lineup: ${event.lineup.join(', ')}`);
  if (event.notes !== null) lines.push(`Notes: ${event.notes}`);
  if (event.sourceUrl !== null) lines.push(event.sourceUrl);
  return lines.join('\n');
}
