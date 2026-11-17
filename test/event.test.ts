import { describe, expect, it } from 'vitest';
import { DEFAULT_DURATION_MINUTES, normalizeEvent, type CalendarEvent, type EventDraft } from '../src/event';
import { wallTimeAt } from '../src/zoned-time';

// Berlin is UTC+2 in summer and UTC+1 in winter. In 2026 its clocks jump from 02:00 to
// 03:00 on 29 March and fall back from 03:00 to 02:00 on 25 October.

function normalized(draft: Partial<EventDraft>, defaultDurationMinutes?: number): CalendarEvent {
  const result = normalizeEvent(
    { title: 'Night', start: '2026-07-18T23:00', timeZone: 'Europe/Berlin', ...draft },
    { defaultDurationMinutes },
  );
  if (!result.ok) throw new Error(`expected an event, got ${result.errors.join(', ')}`);
  return result.event;
}

function iso(date: Date): string {
  return date.toISOString().replace(':00.000Z', 'Z');
}

function hours(event: CalendarEvent): number {
  return (event.end.getTime() - event.start.getTime()) / 3_600_000;
}

describe('the test environment', () => {
  it('runs in a zone far from the events, so reading the machine zone would fail', () => {
    // Pacific/Kiritimati, from vitest.config.ts, which has been UTC+14 since 1995.
    expect(new Date(Date.UTC(2026, 0, 1)).getTimezoneOffset()).toBe(-14 * 60);
  });
});

describe('overnight events', () => {
  it('takes an end time before the start as the next day', () => {
    const event = normalized({ start: '2026-07-18T23:00', end: '06:00' });
    expect(iso(event.start)).toBe('2026-07-18T21:00Z');
    expect(iso(event.end)).toBe('2026-07-19T04:00Z');
    expect(event.endLocal).toEqual({ year: 2026, month: 7, day: 19, hour: 6, minute: 0 });
    expect(event.overnight).toBe(true);
    expect(event.flags).toEqual([]);
  });

  it('accepts an end with its own date', () => {
    const event = normalized({ start: '2026-07-18T23:00', end: '2026-07-19T06:00' });
    expect(iso(event.end)).toBe('2026-07-19T04:00Z');
    expect(event.overnight).toBe(true);
  });

  it('keeps an end time after the start on the same day', () => {
    const event = normalized({ start: '2026-07-18T19:00', end: '23:30' });
    expect(iso(event.end)).toBe('2026-07-18T21:30Z');
    expect(event.overnight).toBe(false);
  });

  it('takes an end time equal to the start as 24 hours later', () => {
    expect(hours(normalized({ start: '2026-07-18T12:00', end: '12:00' }))).toBe(24);
  });

  it('rejects an end date and time before the start', () => {
    const result = normalizeEvent({
      title: 'Night',
      start: '2026-07-18T23:00',
      end: '2026-07-18T06:00',
      timeZone: 'Europe/Berlin',
    });
    expect(result).toEqual({ ok: false, errors: ['end-not-after-start'] });
  });
});

describe('events across a DST change', () => {
  it('lasts an hour longer on the night the clocks go back', () => {
    const event = normalized({ start: '2026-10-24T22:00', end: '06:00' });
    expect(iso(event.start)).toBe('2026-10-24T20:00Z');
    expect(iso(event.end)).toBe('2026-10-25T05:00Z');
    expect(hours(event)).toBe(9);
    expect(event.flags).toEqual([]);
  });

  it('lasts an hour shorter on the night the clocks go forward', () => {
    const event = normalized({ start: '2026-03-28T23:00', end: '06:00' });
    expect(iso(event.start)).toBe('2026-03-28T22:00Z');
    expect(iso(event.end)).toBe('2026-03-29T04:00Z');
    expect(hours(event)).toBe(6);
  });

  it('moves a start the clocks skip forward, and flags it', () => {
    const event = normalized({ start: '2026-03-29T02:30', end: '05:00' });
    expect(iso(event.start)).toBe('2026-03-29T01:30Z');
    expect(event.startLocal).toEqual({ year: 2026, month: 3, day: 29, hour: 3, minute: 30 });
    expect(event.flags).toEqual(['start-skipped']);
  });

  it('takes the earlier of a start the clocks repeat, and flags it', () => {
    const event = normalized({ start: '2026-10-25T02:30', end: '05:00' });
    expect(iso(event.start)).toBe('2026-10-25T00:30Z');
    expect(iso(event.end)).toBe('2026-10-25T04:00Z');
    expect(event.flags).toEqual(['start-ambiguous']);
  });

  it('flags an end the clocks skip', () => {
    const event = normalized({ start: '2026-03-28T23:00', end: '02:30' });
    expect(iso(event.end)).toBe('2026-03-29T01:30Z');
    expect(event.flags).toEqual(['end-skipped']);
  });

  it('flags an end the clocks repeat', () => {
    const event = normalized({ start: '2026-10-24T23:00', end: '02:30' });
    expect(iso(event.end)).toBe('2026-10-25T00:30Z');
    expect(event.flags).toEqual(['end-ambiguous']);
  });
});

describe('events in a timezone other than the user’s', () => {
  it('places the event by its own zone and shows it in the user’s', () => {
    // New York is UTC−5 after 1 November 2026.
    const event = normalized({ start: '2026-11-20T21:00', end: '23:30', timeZone: 'America/New_York' });
    expect(iso(event.start)).toBe('2026-11-21T02:00Z');
    expect(iso(event.end)).toBe('2026-11-21T04:30Z');
    expect(event.startLocal).toEqual({ year: 2026, month: 11, day: 20, hour: 21, minute: 0 });
    expect(wallTimeAt(event.start, 'Europe/Berlin')).toEqual({ year: 2026, month: 11, day: 21, hour: 3, minute: 0 });
    expect(wallTimeAt(event.start, 'Asia/Tokyo')).toEqual({ year: 2026, month: 11, day: 21, hour: 11, minute: 0 });
  });

  it('handles a zone in southern summer time across a new year', () => {
    // Sydney is UTC+11 in December.
    const event = normalized({ start: '2026-12-31T22:00', end: '04:00', timeZone: 'Australia/Sydney' });
    expect(iso(event.start)).toBe('2026-12-31T11:00Z');
    expect(iso(event.end)).toBe('2026-12-31T17:00Z');
    expect(event.endLocal).toEqual({ year: 2027, month: 1, day: 1, hour: 4, minute: 0 });
    expect(event.overnight).toBe(true);
    expect(wallTimeAt(event.start, 'America/Los_Angeles')).toEqual({ year: 2026, month: 12, day: 31, hour: 3, minute: 0 });
  });

  it('gives the zone its canonical name', () => {
    expect(normalized({ timeZone: ' europe/berlin ' }).timeZone).toBe('Europe/Berlin');
  });
});

describe('events with no end time', () => {
  it('gets the default end and a flag', () => {
    const event = normalized({ start: '2026-07-18T23:00' });
    expect(DEFAULT_DURATION_MINUTES).toBe(240);
    expect(iso(event.end)).toBe('2026-07-19T01:00Z');
    expect(event.endLocal).toEqual({ year: 2026, month: 7, day: 19, hour: 3, minute: 0 });
    expect(event.overnight).toBe(true);
    expect(event.flags).toEqual(['end-defaulted']);
  });

  it('treats a blank end as missing', () => {
    expect(normalized({ end: '   ' }).flags).toEqual(['end-defaulted']);
  });

  it('takes the default as elapsed time across a DST change', () => {
    const event = normalized({ start: '2026-10-25T00:00' });
    expect(hours(event)).toBe(4);
    expect(event.endLocal).toEqual({ year: 2026, month: 10, day: 25, hour: 3, minute: 0 });
  });

  it('uses a default duration it is given', () => {
    const event = normalized({ start: '2026-07-18T23:00' }, 90);
    expect(iso(event.end)).toBe('2026-07-18T22:30Z');
    expect(event.flags).toEqual(['end-defaulted']);
  });
});

describe('the other fields', () => {
  it('trims text, drops blanks and repeated names, and keeps the source URL', () => {
    const event = normalized({
      title: '  Night  ',
      venue: ' ',
      lineup: [' Artist A ', 'artist a', '', 'Artist B'],
      sourceUrl: ' https://ra.co/events/1234567 ',
      notes: '\n',
    });
    expect(event.title).toBe('Night');
    expect(event.venue).toBeNull();
    expect(event.lineup).toEqual(['Artist A', 'Artist B']);
    expect(event.sourceUrl).toBe('https://ra.co/events/1234567');
    expect(event.notes).toBeNull();
  });
});

describe('drafts that can’t become events', () => {
  it('says everything that is wrong', () => {
    const result = normalizeEvent({
      title: '  ',
      start: '2026-02-30T22:00',
      timeZone: 'Mars/Olympus',
      sourceUrl: 'ftp://example.com/event',
    });
    expect(result).toEqual({
      ok: false,
      errors: ['title-missing', 'time-zone-invalid', 'start-invalid', 'source-url-invalid'],
    });
  });

  it.each(['2026-07-18 23:00', '2026-07-18T24:00', '18/07/2026 23:00', ''])('rejects the start %j', (start) => {
    const result = normalizeEvent({ title: 'Night', start, timeZone: 'Europe/Berlin' });
    expect(result).toEqual({ ok: false, errors: ['start-invalid'] });
  });

  it.each(['25:00', '6am', '2026-07-19T06:60'])('rejects the end %j', (end) => {
    const result = normalizeEvent({ title: 'Night', start: '2026-07-18T23:00', end, timeZone: 'Europe/Berlin' });
    expect(result).toEqual({ ok: false, errors: ['end-invalid'] });
  });

  it('rejects a source that isn’t a URL', () => {
    const result = normalizeEvent({
      title: 'Night',
      start: '2026-07-18T23:00',
      timeZone: 'Europe/Berlin',
      sourceUrl: 'ra.co events',
    });
    expect(result).toEqual({ ok: false, errors: ['source-url-invalid'] });
  });
});
