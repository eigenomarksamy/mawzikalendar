// V10's calendar view on the page: Google's embed of a public calendar, the demo
// calendar when the page opens, and another one when the user pastes its link.

import { DEMO_CALENDAR_ID, calendarIdFrom, embedUrl, type EmbedMode } from './calendar-embed';

export const NOT_A_CALENDAR =
  'That isn’t a public Google calendar’s link. Paste its ID, its embed link, its public .ics address or its share link.';

function element<T extends Element>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`the page has no ${selector}`);
  return found;
}

/**
 * `embedMode` says how the embed opens, asked each time a calendar is shown: the agenda
 * on a narrow screen, the month grid otherwise (V11).
 */
export function mountCalendarView(document: Document, viewerTimeZone: string, embedMode: () => EmbedMode): void {
  const frame = element<HTMLElement>(document, '#calendar-frame');
  const form = element<HTMLFormElement>(document, '#calendar-form');
  const link = element<HTMLInputElement>(form, '#calendar-link');
  const error = element<HTMLElement>(form, '#calendar-error');

  function show(calendarId: string): void {
    const embed = document.createElement('iframe');
    embed.id = 'calendar-embed';
    embed.title = 'The calendar, in Google’s embed';
    embed.src = embedUrl(calendarId, viewerTimeZone, embedMode());
    frame.replaceChildren(embed);
    frame.hidden = false;
  }

  form.addEventListener('submit', (submitted) => {
    submitted.preventDefault();
    const calendarId = calendarIdFrom(link.value);
    if (calendarId === null) {
      // Anything else shows an error, and nothing stays embedded.
      frame.replaceChildren();
      frame.hidden = true;
      error.textContent = NOT_A_CALENDAR;
      error.hidden = false;
      link.setAttribute('aria-invalid', 'true');
      link.focus();
      return;
    }
    error.textContent = '';
    error.hidden = true;
    link.removeAttribute('aria-invalid');
    show(calendarId);
  });

  show(DEMO_CALENDAR_ID);
}
