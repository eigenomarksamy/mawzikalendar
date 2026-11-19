import { describe, expect, it } from 'vitest';
import { normalizeEvent, type EventError, type EventFlag } from '../src/event';
import { ERROR_FIELD, ERROR_MESSAGE, draftFromFields, flagMessage, type FormFields } from '../src/form';
import { eventFrom } from './event-fixture';

function fields(overrides: Partial<FormFields> = {}): FormFields {
  return {
    title: 'Night',
    start: '2026-07-18T23:00',
    endDate: '',
    endTime: '',
    timeZone: 'Europe/Berlin',
    venue: '',
    lineup: '',
    sourceUrl: '',
    notes: '',
    ...overrides,
  };
}

describe('the form’s fields', () => {
  it('give an end time alone as a time, for the start’s day or the next', () => {
    expect(draftFromFields(fields({ endTime: '06:00' })).end).toBe('06:00');
  });

  it('give an end date and time as one date-time', () => {
    expect(draftFromFields(fields({ endDate: '2026-07-20', endTime: '12:00' })).end).toBe('2026-07-20T12:00');
  });

  it('give no end when both are empty, so the default applies', () => {
    const result = normalizeEvent(draftFromFields(fields()));
    expect(result.ok && result.event.flags).toEqual(['end-defaulted']);
  });

  it('reject an end date with no time', () => {
    expect(normalizeEvent(draftFromFields(fields({ endDate: '2026-07-20' })))).toEqual({
      ok: false,
      errors: ['end-invalid'],
    });
  });

  it('split the lineup into one name per line', () => {
    const result = normalizeEvent(draftFromFields(fields({ lineup: 'Artist A\r\n\r\nArtist B\nartist a\n' })));
    expect(result.ok && result.event.lineup).toEqual(['Artist A', 'Artist B']);
  });
});

describe('what the form says', () => {
  const errors: EventError[] = [
    'title-missing',
    'start-invalid',
    'time-zone-invalid',
    'end-invalid',
    'end-not-after-start',
    'source-url-invalid',
  ];

  it.each(errors)('puts %s by a field, with a message', (error) => {
    expect(ERROR_FIELD[error]).toBeTruthy();
    expect(ERROR_MESSAGE[error]).toMatch(/\.$/);
  });

  it('says when the end was assumed', () => {
    expect(flagMessage('end-defaulted', eventFrom({ end: '' }))).toContain('4 hours');
  });

  it('says where a skipped start moved to', () => {
    const event = eventFrom({ start: '2026-03-29T02:30', end: '05:00' });
    expect(event.flags).toEqual(['start-skipped' satisfies EventFlag]);
    expect(flagMessage('start-skipped', event)).toContain('03:30');
  });
});
