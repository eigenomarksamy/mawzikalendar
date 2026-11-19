import { describe, expect, it } from 'vitest';
import { googleCalendarUrl } from '../src/google-calendar';
import { eventFrom } from './event-fixture';

function params(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

describe('the Google Calendar link', () => {
  it('opens Google’s new-event template', () => {
    const url = new URL(googleCalendarUrl(eventFrom()));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
  });

  it('carries the title, the times in UTC and the event’s zone', () => {
    const query = params(googleCalendarUrl(eventFrom()));
    expect(query.get('text')).toBe('Night at the Club');
    // 23:00 to 06:00 in Berlin, UTC+2 in July.
    expect(query.get('dates')).toBe('20260718T210000Z/20260719T040000Z');
    expect(query.get('ctz')).toBe('Europe/Berlin');
  });

  it('carries the venue as the location and the rest as the details', () => {
    const query = params(
      googleCalendarUrl(eventFrom({ venue: 'Hall 2', lineup: ['Artist A'], sourceUrl: 'https://ra.co/events/1' })),
    );
    expect(query.get('location')).toBe('Hall 2');
    expect(query.get('details')).toBe('Lineup: Artist A\n\nhttps://ra.co/events/1');
  });

  it('leaves out a location and details the event doesn’t have', () => {
    const query = params(googleCalendarUrl(eventFrom()));
    expect(query.has('location')).toBe(false);
    expect(query.has('details')).toBe(false);
  });

  it('encodes spaces as %20 and keeps characters like & and # inside their value', () => {
    const url = googleCalendarUrl(eventFrom({ title: 'Drum & Bass #3 – Night' }));
    expect(url).toContain('text=Drum%20%26%20Bass%20%233%20%E2%80%93%20Night&');
    expect(params(url).get('text')).toBe('Drum & Bass #3 – Night');
  });
});
