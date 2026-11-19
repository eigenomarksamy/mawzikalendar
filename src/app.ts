// The page: the form, the review screen, and the three ways out of it. Everything is
// made in the browser. Nothing is sent anywhere: the Google link is opened by the user,
// the `.ics` is a local blob, and the summary goes to the clipboard.

import { normalizeEvent, type CalendarEvent, type EventError } from './event';
import { ERROR_FIELD, ERROR_MESSAGE, FIELD_NAMES, draftFromFields, flagMessage, type FieldName, type FormFields } from './form';
import { eventSummary, eventWhen, eventWhenIn } from './format';
import { googleCalendarUrl } from './google-calendar';
import { icsFileName, toIcs } from './ics';

/** What the page needs from the browser, so a test can stand in for it. */
export interface AppEnvironment {
  /** The viewer's own IANA timezone. */
  viewerTimeZone: string;
  now(): Date;
  /** A new unique id for an event's `.ics`. */
  newUid(): string;
  /** Puts the text on the clipboard, or rejects. */
  copy(text: string): Promise<void>;
  objectUrl(blob: Blob): string;
  revokeObjectUrl(url: string): void;
}

function element<T extends Element>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`the page has no ${selector}`);
  return found;
}

type FieldInput = HTMLInputElement | HTMLTextAreaElement;

export function mountApp(document: Document, env: AppEnvironment): void {
  const form = element<HTMLFormElement>(document, '#event-form');
  const review = element<HTMLElement>(document, '#review');
  const reviewHeading = element<HTMLElement>(review, '#review-heading');
  const details = element<HTMLDListElement>(review, '#review-details');
  const flags = element<HTMLUListElement>(review, '#review-flags');
  const googleLink = element<HTMLAnchorElement>(review, '#google-link');
  const icsLink = element<HTMLAnchorElement>(review, '#ics-link');
  const copyButton = element<HTMLButtonElement>(review, '#copy-summary');
  const copyStatus = element<HTMLElement>(review, '#copy-status');
  const summaryText = element<HTMLTextAreaElement>(review, '#summary-text');
  const editButton = element<HTMLButtonElement>(review, '#edit');

  const input = (name: FieldName): FieldInput => element<FieldInput>(form, `[name="${name}"]`);
  const errorFor = (name: FieldName): HTMLElement | null => form.querySelector<HTMLElement>(`#error-${name}`);

  const timeZone = input('timeZone');
  if (timeZone.value.trim() === '') timeZone.value = env.viewerTimeZone;
  const zones = document.querySelector<HTMLDataListElement>('#time-zones');
  if (zones && typeof Intl.supportedValuesOf === 'function') {
    for (const zone of Intl.supportedValuesOf('timeZone')) {
      const option = document.createElement('option');
      option.value = zone;
      zones.append(option);
    }
  }

  let icsUrl: string | null = null;
  let summary = '';

  function readFields(): FormFields {
    const fields = {} as FormFields;
    for (const name of FIELD_NAMES) fields[name] = input(name).value;
    return fields;
  }

  function showErrors(errors: readonly EventError[]): void {
    for (const name of FIELD_NAMES) {
      input(name).removeAttribute('aria-invalid');
      const slot = errorFor(name);
      if (slot) {
        slot.textContent = '';
        slot.hidden = true;
      }
    }
    for (const error of errors) {
      const name = ERROR_FIELD[error];
      input(name).setAttribute('aria-invalid', 'true');
      const slot = errorFor(name);
      if (slot) {
        slot.textContent = slot.textContent ? `${slot.textContent} ${ERROR_MESSAGE[error]}` : ERROR_MESSAGE[error];
        slot.hidden = false;
      }
    }
    const first = errors[0];
    if (first) input(ERROR_FIELD[first]).focus();
  }

  function addDetail(term: string, value: string, id?: string): void {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value;
    if (id) dd.id = id;
    details.append(dt, dd);
  }

  function releaseIcs(): void {
    if (icsUrl !== null) env.revokeObjectUrl(icsUrl);
    icsUrl = null;
  }

  function showReview(event: CalendarEvent): void {
    details.replaceChildren();
    addDetail('Title', event.title, 'review-title');
    addDetail('When', eventWhen(event), 'review-when');
    if (env.viewerTimeZone !== event.timeZone) {
      addDetail('Your time', eventWhenIn(event, env.viewerTimeZone), 'review-viewer-when');
    }
    if (event.venue !== null) addDetail('Venue', event.venue, 'review-venue');
    if (event.lineup.length > 0) addDetail('Lineup', event.lineup.join(', '), 'review-lineup');
    if (event.sourceUrl !== null) addDetail('Source', event.sourceUrl, 'review-source');
    if (event.notes !== null) addDetail('Notes', event.notes, 'review-notes');

    flags.replaceChildren(
      ...event.flags.map((flag) => {
        const item = document.createElement('li');
        item.textContent = flagMessage(flag, event);
        return item;
      }),
    );
    flags.hidden = event.flags.length === 0;

    googleLink.href = googleCalendarUrl(event);

    releaseIcs();
    const ics = toIcs(event, { uid: env.newUid(), now: env.now() });
    icsUrl = env.objectUrl(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    icsLink.href = icsUrl;
    icsLink.download = icsFileName(event);

    summary = eventSummary(event);
    summaryText.value = summary;
    copyStatus.textContent = '';

    form.hidden = true;
    review.hidden = false;
    reviewHeading.focus();
  }

  form.addEventListener('submit', (submitted) => {
    submitted.preventDefault();
    const result = normalizeEvent(draftFromFields(readFields()));
    if (!result.ok) {
      showErrors(result.errors);
      return;
    }
    showErrors([]);
    showReview(result.event);
  });

  editButton.addEventListener('click', () => {
    releaseIcs();
    review.hidden = true;
    form.hidden = false;
    input('title').focus();
  });

  copyButton.addEventListener('click', () => {
    env.copy(summary).then(
      () => {
        copyStatus.textContent = 'Copied.';
      },
      () => {
        copyStatus.textContent = 'Couldn’t copy. Select the summary below and copy it.';
        summaryText.select();
      },
    );
  });
}
