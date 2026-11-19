// A link that opens Google Calendar's new-event page, prefilled. It needs no OAuth: the
// user saves the event themselves, in their own Google account.

import type { CalendarEvent } from './event';
import { eventDetails, utcStamp } from './format';

const TEMPLATE_URL = 'https://calendar.google.com/calendar/render';

/**
 * The prefilled link. Times go in UTC, which Google reads exactly, and `ctz` sets the
 * event's own zone, so the event page shows the times as the event's clocks do.
 */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params: [string, string][] = [
    ['action', 'TEMPLATE'],
    ['text', event.title],
    ['dates', `${utcStamp(event.start)}/${utcStamp(event.end)}`],
    ['ctz', event.timeZone],
  ];
  const details = eventDetails(event);
  if (details !== '') params.push(['details', details]);
  if (event.venue !== null) params.push(['location', event.venue]);
  // encodeURIComponent writes a space as %20, where URLSearchParams would write `+`.
  return `${TEMPLATE_URL}?${params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}`;
}
