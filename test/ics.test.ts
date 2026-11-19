import { describe, expect, it } from 'vitest';
import { escapeText, foldLine, icsFileName, toIcs } from '../src/ics';
import { eventFrom } from './event-fixture';

const options = { uid: 'test-uid@mawzikalendar.eigenomar.com', now: new Date(Date.UTC(2026, 10, 19, 12, 0, 0)) };

/** The content lines, with folded lines joined back up as RFC 5545 unfolds them. */
function contentLines(ics: string): string[] {
  return ics.replace(/\r\n /g, '').split('\r\n').slice(0, -1);
}

describe('the .ics file', () => {
  it('is one VEVENT in a VCALENDAR, with the event in UTC', () => {
    expect(contentLines(toIcs(eventFrom(), options))).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//eigenomar//mawzikalendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:test-uid@mawzikalendar.eigenomar.com',
      'DTSTAMP:20261119T120000Z',
      'DTSTART:20260718T210000Z',
      'DTEND:20260719T040000Z',
      'SUMMARY:Night at the Club',
      'END:VEVENT',
      'END:VCALENDAR',
    ]);
  });

  it('carries the venue, the description and the source URL', () => {
    const lines = contentLines(
      toIcs(eventFrom({ venue: 'Hall 2, Berlin', lineup: ['A', 'B'], sourceUrl: 'https://ra.co/events/1' }), options),
    );
    expect(lines).toContain('LOCATION:Hall 2\\, Berlin');
    expect(lines).toContain('DESCRIPTION:Lineup: A\\, B\\n\\nhttps://ra.co/events/1');
    expect(lines).toContain('URL:https://ra.co/events/1');
  });

  it('ends every line with CRLF, and has no bare LF', () => {
    const ics = toIcs(eventFrom({ notes: 'line one\nline two' }), options);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  it('keeps every line within 75 octets', () => {
    const ics = toIcs(eventFrom({ title: 'Ünïcødé nacht — '.repeat(12), notes: '🎧 '.repeat(60) }), options);
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('places a DST-crossing night at the right instants', () => {
    // Berlin falls back from 03:00 to 02:00 on 25 October 2026: a nine-hour night.
    const lines = contentLines(toIcs(eventFrom({ start: '2026-10-24T22:00', end: '06:00' }), options));
    expect(lines).toContain('DTSTART:20261024T200000Z');
    expect(lines).toContain('DTEND:20261025T050000Z');
  });
});

describe('escaping text', () => {
  it('escapes backslashes, semicolons, commas and newlines', () => {
    expect(escapeText('a\\b;c,d\ne\r\nf')).toBe('a\\\\b\\;c\\,d\\ne\\nf');
  });
});

describe('folding lines', () => {
  it('leaves a short line alone', () => {
    expect(foldLine('SUMMARY:short')).toBe('SUMMARY:short');
  });

  it('folds at 75 octets, starting each continuation with a space', () => {
    const folded = foldLine(`DESCRIPTION:${'x'.repeat(100)}`);
    const [first, second] = folded.split('\r\n');
    expect(first).toHaveLength(75);
    expect(second).toBe(` ${'x'.repeat(112 - 75)}`);
  });

  it('never splits a character across lines', () => {
    const line = `SUMMARY:${'é'.repeat(80)}`;
    const folded = foldLine(line);
    expect(folded.replace(/\r\n /g, '')).toBe(line);
    // 8 octets of `SUMMARY:` and 33 two-octet characters: a 34th would make 76.
    expect(new TextEncoder().encode(folded.split('\r\n')[0]).length).toBe(74);
  });
});

describe('the file name', () => {
  it('is the start’s date on the event’s clocks and the title', () => {
    expect(icsFileName(eventFrom())).toBe('2026-07-18-night-at-the-club.ics');
  });

  it('drops accents and punctuation', () => {
    expect(icsFileName(eventFrom({ title: '  Café Nüit: Drum & Bass!  ' }))).toBe('2026-07-18-cafe-nuit-drum-bass.ics');
  });

  it('falls back to “event” for a title with no letters or digits', () => {
    expect(icsFileName(eventFrom({ title: '★ ★ ★' }))).toBe('2026-07-18-event.ics');
  });
});
