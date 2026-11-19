import { describe, expect, it } from 'vitest';
import { normalizeEvent } from '../src/event';
import { draftFromFields, type FormFields } from '../src/form';
import { extractFromRaText, type RaExtraction } from '../src/ra-text';
import { zoneForPlace } from '../src/time-zones';
import { BERLIN_NIGHT, BROOKLYN_NIGHT, FESTIVAL, UNKNOWN_PLACE } from './ra-fixtures';

const options = { viewerTimeZone: 'Asia/Tokyo', now: new Date(Date.UTC(2026, 10, 19, 12)) };

function extract(text: string): RaExtraction {
  return extractFromRaText(text, options);
}

function noteFor(result: RaExtraction, field: string) {
  return result.notes.filter((n) => n.field === field);
}

const EMPTY: FormFields = {
  title: '', start: '', endDate: '', endTime: '', timeZone: '', venue: '', lineup: '', sourceUrl: '', notes: '',
};

describe('text from an ra.co event page', () => {
  it('fills every field of a night in Berlin, and flags nothing', () => {
    const result = extract(BERLIN_NIGHT);
    expect(result.fields).toEqual({
      title: 'Night at the Club',
      start: '2026-07-18T23:00',
      endTime: '07:00',
      timeZone: 'Europe/Berlin',
      venue: 'Hall 2, Example Straße 12, 10243 Berlin, Germany',
      lineup: 'Artist A\nArtist B b2b Artist C\nArtist D (live)',
      sourceUrl: 'https://ra.co/events/1234567',
    });
    expect(result.notes).toEqual([]);
  });

  it('becomes an event the rest of the app accepts', () => {
    const result = normalizeEvent(draftFromFields({ ...EMPTY, ...extract(BERLIN_NIGHT).fields }));
    expect(result.ok && result.event.overnight).toBe(true);
    expect(result.ok && result.event.end.toISOString()).toBe('2026-07-19T05:00:00.000Z');
  });

  it('reads 12-hour times, a month before its day, a city in a country with several zones and a link without https', () => {
    const result = extract(BROOKLYN_NIGHT);
    expect(result.fields).toMatchObject({
      title: 'Warehouse Party',
      start: '2026-11-20T22:00',
      endTime: '04:00',
      timeZone: 'America/New_York',
      venue: 'Example Warehouse, 123 Example Ave, Brooklyn, NY 11211, United States',
      lineup: 'Artist A\nArtist B\nArtist C',
      sourceUrl: 'https://ra.co/events/7654321',
    });
    expect(result.notes).toEqual([]);
  });

  it('chooses the year whose weekday matches, and keeps a festival’s end date', () => {
    // 6 August is a Friday in 2027 and a Thursday in 2026.
    const result = extract(FESTIVAL);
    expect(result.fields).toMatchObject({
      title: 'Example Open Air 2027',
      start: '2027-08-06T14:00',
      endDate: '2027-08-08',
      endTime: '23:00',
      timeZone: 'Europe/London',
    });
    expect(noteFor(result, 'start')).toEqual([]);
    expect(noteFor(result, 'sourceUrl')).toEqual([expect.objectContaining({ kind: 'missing' })]);
  });

  it('flags what is missing and what it can’t decide', () => {
    const result = extract(UNKNOWN_PLACE);
    expect(result.fields).toMatchObject({ title: 'Secret Party', start: '2026-12-12T22:00', timeZone: 'Asia/Tokyo' });
    expect(result.fields.venue).toBeUndefined();
    expect(result.fields.endTime).toBeUndefined();
    expect(result.notes.map((n) => [n.field, n.kind])).toEqual([
      ['sourceUrl', 'missing'],
      ['venue', 'missing'],
      ['timeZone', 'ambiguous'],
      ['lineup', 'missing'],
    ]);
    expect(noteFor(result, 'timeZone')[0]?.message).toContain('Asia/Tokyo');
  });
});

describe('dates and times', () => {
  const at = (date: string) => extract(`Party\nVenue\nHall 2, Berlin\nDate\n${date}`);

  it.each([
    ['Saturday 18 July 2026, 23:00 – 07:00', '2026-07-18T23:00', '07:00'],
    ['18th Jul 2026 11pm - 7am', '2026-07-18T23:00', '07:00'],
    ['Sat, Jul 18, 2026 11:30 PM to 6 AM', '2026-07-18T23:30', '06:00'],
    ['18.07.2026 23.00–07.00', '2026-07-18T23:00', '07:00'],
    ['2026-07-18 23:00 - 07:00', '2026-07-18T23:00', '07:00'],
    ['Sat, 18 Jul 2026 12 AM - 12 PM', '2026-07-18T00:00', '12:00'],
  ])('reads %j', (date, start, endTime) => {
    expect(at(date).fields).toMatchObject({ start, endTime });
  });

  it('doesn’t read a numeric date as a time', () => {
    const result = at('18.07.2026');
    expect(result.fields.start).toBeUndefined();
    expect(noteFor(result, 'start')[0]?.message).toContain('2026-07-18');
  });

  it('flags a date with no year and no weekday, and takes the next one to come', () => {
    const result = at('18 Jul 23:00 - 07:00');
    expect(result.fields.start).toBe('2027-07-18T23:00');
    expect(noteFor(result, 'start')).toEqual([expect.objectContaining({ kind: 'ambiguous' })]);
  });

  it('flags a weekday that doesn’t match the date', () => {
    const result = at('Fri, 18 Jul 2026 23:00 - 07:00');
    expect(result.fields.start).toBe('2026-07-18T23:00');
    expect(noteFor(result, 'start')[0]?.message).toContain('weekday');
  });

  it('flags a date that doesn’t exist', () => {
    expect(noteFor(at('30 Feb 2026 23:00'), 'start')).toEqual([expect.objectContaining({ kind: 'ambiguous' })]);
  });

  it('puts an end with no year across new year in the next year', () => {
    expect(at('Thu, 31 Dec 2026 - Fri, 1 Jan 22:00 - 06:00').fields).toMatchObject({
      start: '2026-12-31T22:00',
      endDate: '2027-01-01',
    });
  });

  it('doesn’t read words that start like a month as one', () => {
    expect(at('Marching 12 band').fields.start).toBeUndefined();
  });
});

describe('other text', () => {
  it('takes the old residentadvisor.net link as the ra.co one, and flags several events', () => {
    const result = extract('Party\nhttps://www.residentadvisor.net/events/1111\nra.co/events/2222');
    expect(result.fields.sourceUrl).toBe('https://ra.co/events/1111');
    expect(noteFor(result, 'sourceUrl')).toEqual([expect.objectContaining({ kind: 'ambiguous' })]);
  });

  it('flags a title taken from text that isn’t an ra.co page', () => {
    const result = extract('A night out with friends\nsometime soon');
    expect(result.fields.title).toBe('A night out with friends');
    expect(noteFor(result, 'title')).toEqual([expect.objectContaining({ kind: 'ambiguous' })]);
  });

  it('flags everything for empty text, and fills in the viewer’s timezone', () => {
    const result = extract('   ');
    expect(result.fields).toEqual({ timeZone: 'Asia/Tokyo' });
    expect(result.notes.map((n) => n.field)).toEqual(['sourceUrl', 'title', 'venue', 'timeZone', 'start', 'lineup']);
  });
});

describe('places to timezones', () => {
  it.each([
    [['Hall 2, Berlin'], 'Europe/Berlin'],
    [['Somewhere; Germany'], 'Europe/Berlin'],
    [['Club, Atlanta, Georgia, United States'], 'America/New_York'],
    [['', 'Australia', 'Melbourne'], 'Australia/Melbourne'],
    [['Bar, São Paulo, Brazil'], 'America/Sao_Paulo'],
  ])('finds the zone of %j', (texts, timeZone) => {
    expect(zoneForPlace(texts)).toMatchObject({ kind: 'found', timeZone });
  });

  it('doesn’t read the US state Georgia as the country', () => {
    expect(zoneForPlace(['Savannah, Georgia, United States'])).toEqual({ kind: 'several', country: 'united states' });
  });

  it('knows nothing of a place not in its table', () => {
    expect(zoneForPlace(['Atlantis'])).toEqual({ kind: 'none' });
  });
});
