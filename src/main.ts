import './style.css';
import { mountApp } from './app';
import { mountCalendarView } from './calendar-view';

const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

mountCalendarView(document, viewerTimeZone);
mountApp(document, {
  viewerTimeZone,
  now: () => new Date(),
  newUid: () => `${crypto.randomUUID()}@mawzikalendar.eigenomar.com`,
  // Async, so a browser without the Clipboard API rejects instead of throwing.
  copy: async (text) => navigator.clipboard.writeText(text),
  objectUrl: (blob) => URL.createObjectURL(blob),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
});
