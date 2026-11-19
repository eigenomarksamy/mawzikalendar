// What the form's fields become, and what the form and the review screen say about it.

import { DEFAULT_DURATION_MINUTES, type CalendarEvent, type EventDraft, type EventError, type EventFlag } from './event';
import { formatTime } from './format';

/** The form's fields, as their inputs give them. */
export interface FormFields {
  title: string;
  /** `YYYY-MM-DDTHH:mm`, from a `datetime-local` input. */
  start: string;
  /** `YYYY-MM-DD` from a `date` input, or empty: the end is on the start's day or the next. */
  endDate: string;
  /** `HH:mm` from a `time` input, or empty. */
  endTime: string;
  timeZone: string;
  venue: string;
  /** One name per line. */
  lineup: string;
  sourceUrl: string;
  notes: string;
}

export type FieldName = keyof FormFields;

export const FIELD_NAMES: readonly FieldName[] = [
  'title',
  'start',
  'endDate',
  'endTime',
  'timeZone',
  'venue',
  'lineup',
  'sourceUrl',
  'notes',
];

/** The draft the fields describe. An end date with no time is left for normalization to reject. */
export function draftFromFields(fields: FormFields): EventDraft {
  const endDate = fields.endDate.trim();
  const endTime = fields.endTime.trim();
  const end = endDate === '' ? endTime : `${endDate}T${endTime}`;
  return {
    title: fields.title,
    start: fields.start,
    end,
    timeZone: fields.timeZone,
    venue: fields.venue,
    lineup: fields.lineup.split(/\r\n|\r|\n/),
    sourceUrl: fields.sourceUrl,
    notes: fields.notes,
  };
}

/** The field each error belongs to, where the form shows it. */
export const ERROR_FIELD: Record<EventError, FieldName> = {
  'title-missing': 'title',
  'start-invalid': 'start',
  'time-zone-invalid': 'timeZone',
  'end-invalid': 'endTime',
  'end-not-after-start': 'endTime',
  'source-url-invalid': 'sourceUrl',
};

export const ERROR_MESSAGE: Record<EventError, string> = {
  'title-missing': 'Give the event a title.',
  'start-invalid': 'Give the start’s date and time.',
  'time-zone-invalid': 'Choose a timezone from the list, such as Europe/Berlin.',
  'end-invalid': 'Give the end a time. Add a date only if it ends later than the next day.',
  'end-not-after-start': 'The end is before the start.',
  'source-url-invalid': 'The source must be a web address starting with https:// or http://.',
};

/** What the review screen says about something normalization worked out or guessed. */
export function flagMessage(flag: EventFlag, event: CalendarEvent): string {
  switch (flag) {
    case 'end-defaulted':
      return `No end time was given, so the event ends ${DEFAULT_DURATION_MINUTES / 60} hours after it starts. Edit it to set one.`;
    case 'start-skipped':
      return `The start time doesn’t exist that day, because the clocks go forward, so the event starts at ${formatTime(event.startLocal)}.`;
    case 'start-ambiguous':
      return 'The start time happens twice that night, because the clocks go back. The first one is used.';
    case 'end-skipped':
      return `The end time doesn’t exist that day, because the clocks go forward, so the event ends at ${formatTime(event.endLocal)}.`;
    case 'end-ambiguous':
      return 'The end time happens twice that night, because the clocks go back. The first one is used.';
  }
}
