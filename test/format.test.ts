import { describe, expect, it } from 'vitest';
import { eventDetails, eventSummary, eventWhen, eventWhenIn, formatRange, utcStamp } from '../src/format';
import { eventFrom } from './event-fixture';

describe('dates and times', () => {
  it('writes a range within one day with a dash between the times', () => {
    const start = { year: 2026, month: 7, day: 18, hour: 19, minute: 0 };
    expect(formatRange(start, { ...start, hour: 23, minute: 30 })).toBe('Sat 18 Jul 2026, 19:00–23:30');
  });

  it('writes both dates of an overnight event, on its own clocks', () => {
    expect(eventWhen(eventFrom())).toBe('Sat 18 Jul 2026, 23:00 – Sun 19 Jul 2026, 06:00 (Europe/Berlin)');
  });

  it('writes the event on the viewer’s clocks', () => {
    // Berlin is UTC+2 in July, New York UTC−4.
    expect(eventWhenIn(eventFrom(), 'America/New_York')).toBe(
      'Sat 18 Jul 2026, 17:00 – Sun 19 Jul 2026, 00:00 (America/New_York)',
    );
  });

  it('writes an instant in UTC for iCalendar and Google', () => {
    expect(utcStamp(new Date(Date.UTC(2026, 6, 18, 21, 5, 9, 450)))).toBe('20260718T210509Z');
  });
});

describe('the summary to copy', () => {
  it('holds every reviewed field, one to a line', () => {
    const event = eventFrom({
      venue: 'Hall 2, Berlin',
      lineup: ['Artist A', 'Artist B'],
      sourceUrl: 'https://ra.co/events/1234567',
      notes: 'Doors at 22:30',
    });
    expect(eventSummary(event)).toBe(
      [
        'Night at the Club',
        'Sat 18 Jul 2026, 23:00 – Sun 19 Jul 2026, 06:00 (Europe/Berlin)',
        'Venue: Hall 2, Berlin',
        'Lineup: Artist A, Artist B',
        'Notes: Doors at 22:30',
        'https://ra.co/events/1234567',
      ].join('\n'),
    );
  });

  it('says when the end was assumed, and leaves out what is missing', () => {
    expect(eventSummary(eventFrom({ end: '' }))).toBe(
      'Night at the Club\nSat 18 Jul 2026, 23:00 – Sun 19 Jul 2026, 03:00 (Europe/Berlin), end time assumed',
    );
  });
});

describe('the calendar entry’s description', () => {
  it('holds the lineup, the notes and the source, in paragraphs', () => {
    const event = eventFrom({ lineup: ['Artist A'], notes: 'Bring cash', sourceUrl: 'https://ra.co/events/1' });
    expect(eventDetails(event)).toBe('Lineup: Artist A\n\nBring cash\n\nhttps://ra.co/events/1');
  });

  it('says when the end was assumed', () => {
    expect(eventDetails(eventFrom({ end: '' }))).toBe('End time assumed: the event didn’t give one.');
  });

  it('is empty for an event with nothing more to say', () => {
    expect(eventDetails(eventFrom())).toBe('');
  });
});
