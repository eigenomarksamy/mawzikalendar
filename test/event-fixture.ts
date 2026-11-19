import { normalizeEvent, type CalendarEvent, type EventDraft } from '../src/event';

/** A normalized event from a draft that must be valid: by default, a night in Berlin. */
export function eventFrom(draft: Partial<EventDraft> = {}): CalendarEvent {
  const result = normalizeEvent({
    title: 'Night at the Club',
    start: '2026-07-18T23:00',
    end: '06:00',
    timeZone: 'Europe/Berlin',
    ...draft,
  });
  if (!result.ok) throw new Error(`expected an event, got ${result.errors.join(', ')}`);
  return result.event;
}
