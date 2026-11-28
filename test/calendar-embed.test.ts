import { describe, expect, it } from 'vitest';
import { DEMO_CALENDAR_ID, calendarIdFrom, embedUrl } from '../src/calendar-embed';

const ID = DEMO_CALENDAR_ID;
const ENCODED = ID.replace('@', '%40');
/** The ID in base64, as a share link's `cid` carries it: URL-safe and without its padding. */
const CID = btoa(ID).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('the calendar ID in a pasted link', () => {
  it('reads the ID itself, a created calendar’s, a user’s or one of Google’s', () => {
    expect(calendarIdFrom(ID)).toBe(ID);
    expect(calendarIdFrom(`  ${ID}\n`)).toBe(ID);
    expect(calendarIdFrom('someone@gmail.com')).toBe('someone@gmail.com');
    expect(calendarIdFrom('en.usa#holiday@group.v.calendar.google.com')).toBe('en.usa#holiday@group.v.calendar.google.com');
  });

  it('reads an embed link’s src, whatever else it carries', () => {
    expect(calendarIdFrom(`https://calendar.google.com/calendar/embed?src=${ENCODED}&ctz=Europe%2FBerlin`)).toBe(ID);
    expect(calendarIdFrom(`https://calendar.google.com/calendar/embed?height=600&src=${ENCODED}`)).toBe(ID);
    // An iframe's src copied without its scheme.
    expect(calendarIdFrom(`calendar.google.com/calendar/embed?src=${ENCODED}`)).toBe(ID);
  });

  it('reads the public .ics address', () => {
    expect(calendarIdFrom(`https://calendar.google.com/calendar/ical/${ENCODED}/public/basic.ics`)).toBe(ID);
    expect(calendarIdFrom('https://calendar.google.com/calendar/ical/someone%40gmail.com/public/basic.ics')).toBe(
      'someone@gmail.com',
    );
  });

  it('reads a share link’s cid, the ID in base64, with or without padding', () => {
    expect(calendarIdFrom(`https://calendar.google.com/calendar/u/0?cid=${CID}`)).toBe(ID);
    expect(calendarIdFrom(`https://calendar.google.com/calendar/r?cid=${btoa('someone@gmail.com')}`)).toBe(
      'someone@gmail.com',
    );
    // Some share links carry the ID itself.
    expect(calendarIdFrom(`https://calendar.google.com/calendar/render?cid=${ENCODED}`)).toBe(ID);
  });

  it('finds nothing in anything else', () => {
    for (const pasted of [
      '',
      '   ',
      'my calendar',
      'not an id@',
      'https://ra.co/events/1234567',
      `https://calendar.example.com/calendar/embed?src=${ENCODED}`,
      `https://evil.test/?u=https://calendar.google.com/calendar/embed?src=${ENCODED}`,
      'https://calendar.google.com/calendar/embed',
      'https://calendar.google.com/calendar/embed?src=nobody',
      'https://calendar.google.com/calendar/ical/nobody/public/basic.ics',
      'https://calendar.google.com/calendar/ical/%E0%A4%A/public/basic.ics',
      'https://calendar.google.com/calendar/u/0?cid=%%%',
      `https://calendar.google.com/calendar/u/0?cid=${btoa('not a calendar')}`,
    ]) {
      expect(calendarIdFrom(pasted), pasted).toBeNull();
    }
  });
});

describe('the embed’s address', () => {
  it('is Google’s embed of the calendar, in the viewer’s timezone', () => {
    const url = new URL(embedUrl(ID, 'America/New_York'));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/embed');
    expect(url.searchParams.get('src')).toBe(ID);
    expect(url.searchParams.get('ctz')).toBe('America/New_York');
    expect(embedUrl(ID, 'America/New_York')).toBe(
      `https://calendar.google.com/calendar/embed?src=${ENCODED}&ctz=America%2FNew_York`,
    );
  });

  it('opens on the month grid, Google’s default, unless the agenda is asked for', () => {
    expect(embedUrl(ID, 'UTC')).toBe(embedUrl(ID, 'UTC', 'month'));
    expect(new URL(embedUrl(ID, 'UTC', 'month')).searchParams.has('mode')).toBe(false);
    const agenda = new URL(embedUrl(ID, 'America/New_York', 'agenda'));
    expect(agenda.searchParams.get('mode')).toBe('AGENDA');
    expect(agenda.searchParams.get('src')).toBe(ID);
    expect(agenda.searchParams.get('ctz')).toBe('America/New_York');
  });

  it('keeps a # in an ID out of the fragment', () => {
    const url = new URL(embedUrl('en.usa#holiday@group.v.calendar.google.com', 'UTC'));
    expect(url.hash).toBe('');
    expect(url.searchParams.get('src')).toBe('en.usa#holiday@group.v.calendar.google.com');
  });
});
