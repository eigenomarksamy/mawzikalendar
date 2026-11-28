// V10's calendar view: the ID of a public Google calendar, read from whatever form of it
// is pasted, and the address of Google's own embed of it. The app can't read a public
// calendar's events itself (Google's .ics feed sends no CORS header, and there is no
// backend), so it shows Google's embed instead.

/** The calendar the view shows when the page opens: the one the guide subscribes to. */
export const DEMO_CALENDAR_ID = '804029e95cd89e1774b3f607a8ba76ced8c2e5fcafdee554927f30a0bba0b46b@group.calendar.google.com';

const EMBED_URL = 'https://calendar.google.com/calendar/embed';
const GOOGLE_HOST = 'calendar.google.com';

/**
 * A calendar ID is an address: a user's own (`name@gmail.com`), a created calendar's
 * (`<hex>@group.calendar.google.com`), or one of Google's (`en.usa#holiday@group.v.calendar.google.com`).
 */
const CALENDAR_ID = /^[^\s@/?]+@(?:[a-z0-9-]+\.)+[a-z]{2,}$/i;

function asId(text: string | null | undefined): string | null {
  if (text == null) return null;
  const trimmed = text.trim();
  return CALENDAR_ID.test(trimmed) ? trimmed : null;
}

/** A share link's `cid` is the ID in base64, often URL-safe and without its padding. */
function fromBase64(cid: string): string | null {
  const standard = cid.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard.padEnd(standard.length + ((4 - (standard.length % 4)) % 4), '=');
  try {
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function parseUrl(text: string): URL | null {
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  try {
    return new URL(withScheme);
  } catch {
    return null;
  }
}

/**
 * The calendar ID in what the user pasted, or null if it holds none. It reads the ID
 * itself, an embed link (`/calendar/embed?src=<ID>`), the public `.ics` address
 * (`/calendar/ical/<ID>/public/basic.ics`), or a share link (`?cid=<the ID in base64>`).
 */
export function calendarIdFrom(pasted: string): string | null {
  const text = pasted.trim();
  if (text === '') return null;

  const id = asId(text);
  if (id !== null) return id;

  const url = parseUrl(text);
  if (url === null || url.hostname.toLowerCase() !== GOOGLE_HOST) return null;

  const src = asId(url.searchParams.get('src'));
  if (src !== null) return src;

  const ical = /^\/calendar\/ical\/([^/]+)\//.exec(url.pathname);
  if (ical?.[1] !== undefined) {
    try {
      return asId(decodeURIComponent(ical[1]));
    } catch {
      return null;
    }
  }

  const cid = url.searchParams.get('cid');
  if (cid !== null) return asId(fromBase64(cid)) ?? asId(cid);

  return null;
}

/** Google's embed of the calendar, in the viewer's own timezone. */
export function embedUrl(calendarId: string, viewerTimeZone: string): string {
  return `${EMBED_URL}?src=${encodeURIComponent(calendarId)}&ctz=${encodeURIComponent(viewerTimeZone)}`;
}
