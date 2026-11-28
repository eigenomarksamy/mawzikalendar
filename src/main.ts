import './style.css';
import { mountApp } from './app';
import { mountCalendarView } from './calendar-view';

const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Up to 40rem, a phone's width, the month grid is too narrow, so the embed opens on its agenda (V11).
const narrow = window.matchMedia('(max-width: 40rem)');
mountCalendarView(document, viewerTimeZone, () => (narrow.matches ? 'agenda' : 'month'));
mountApp(document, {
  viewerTimeZone,
  now: () => new Date(),
  newUid: () => `${crypto.randomUUID()}@mawzikalendar.eigenomar.com`,
  // Async, so a browser without the Clipboard API rejects instead of throwing.
  copy: async (text) => navigator.clipboard.writeText(text),
  objectUrl: (blob) => URL.createObjectURL(blob),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
});
