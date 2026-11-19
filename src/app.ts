// The page: the form, filled by hand or from pasted ra.co text, the review screen, and
// the three ways out of it. Everything is made in the browser. Nothing is sent anywhere:
// pasted text is read where it is, the Google link is opened by the user, the `.ics` is
// a local blob, and the summary goes to the clipboard.

import { normalizeEvent, type CalendarEvent, type EventError } from './event';
import {
  ERROR_FIELD,
  ERROR_MESSAGE,
  FIELD_LABEL,
  FIELD_NAMES,
  draftFromFields,
  flagMessage,
  type FieldName,
  type FormFields,
} from './form';
import { eventSummary, eventWhen, eventWhenIn } from './format';
import { googleCalendarUrl } from './google-calendar';
import { icsFileName, toIcs } from './ics';
import { extractFromRaText, type ExtractionNote } from './ra-text';

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
  const raText = element<HTMLTextAreaElement>(form, '#ra-text');
  const fillButton = element<HTMLButtonElement>(form, '#fill-from-ra');
  const pasteStatus = element<HTMLElement>(form, '#paste-status');
  const pasteNotes = element<HTMLUListElement>(form, '#paste-notes');

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
  /** What the pasted text left for the user to check, until they edit the field. */
  let pending: ExtractionNote[] = [];

  function noteItem(note: ExtractionNote): HTMLLIElement {
    const item = document.createElement('li');
    item.textContent = `${FIELD_LABEL[note.field]}: ${note.message}`;
    item.dataset.field = note.field;
    return item;
  }

  function showPending(): void {
    for (const name of FIELD_NAMES) input(name).removeAttribute('data-flagged');
    for (const note of pending) input(note.field).dataset.flagged = 'true';
    pasteNotes.replaceChildren(...pending.map(noteItem));
    pasteNotes.hidden = pending.length === 0;
  }

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
      ...pending.map(noteItem),
      ...event.flags.map((flag) => {
        const item = document.createElement('li');
        item.textContent = flagMessage(flag, event);
        item.dataset.flag = flag;
        return item;
      }),
    );
    flags.hidden = pending.length === 0 && event.flags.length === 0;

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

  fillButton.addEventListener('click', () => {
    const text = raText.value;
    if (text.trim() === '') {
      pasteStatus.textContent = 'Paste the text of an ra.co event page first.';
      return;
    }
    const { fields, notes } = extractFromRaText(text, { viewerTimeZone: env.viewerTimeZone, now: env.now() });
    // The text replaces every field it reads, and the user's own notes stay.
    for (const name of FIELD_NAMES) {
      if (name !== 'notes') input(name).value = fields[name] ?? '';
    }
    showErrors([]);
    pending = notes;
    showPending();
    const filled = FIELD_NAMES.filter((name) => fields[name] !== undefined).length;
    pasteStatus.textContent =
      notes.length === 0
        ? `Filled ${filled} fields from the text.`
        : `Filled ${filled} fields from the text. Check the ${notes.length === 1 ? 'one' : notes.length} below.`;
  });

  // Editing a field the text left in doubt settles it.
  form.addEventListener('input', (edited) => {
    const name = (edited.target as Partial<FieldInput> | null)?.name as FieldName | undefined;
    if (name === undefined || !FIELD_NAMES.includes(name) || !pending.some((n) => n.field === name)) return;
    pending = pending.filter((n) => n.field !== name);
    showPending();
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
