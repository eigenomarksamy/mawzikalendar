import './style.css';
import { mountApp } from './app';

mountApp(document, {
  viewerTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  now: () => new Date(),
  newUid: () => `${crypto.randomUUID()}@mawzikalendar.eigenomar.com`,
  // Async, so a browser without the Clipboard API rejects instead of throwing.
  copy: async (text) => navigator.clipboard.writeText(text),
  objectUrl: (blob) => URL.createObjectURL(blob),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
});
