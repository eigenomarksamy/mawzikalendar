import type { BrowserContext } from '@playwright/test';

// The page loads one thing from another host: Google's embed of a calendar (V10). The
// tests stub it, so they send nothing to Google, and leave it out of the requests that
// must not happen.

const EMBED = 'https://calendar.google.com/calendar/embed?';

/** Whether a request is for Google's calendar embed, the one other host the page loads. */
export function isEmbed(url: string): boolean {
  return url.startsWith(EMBED);
}

/** Answers every embed with a stub page, and returns the embeds the page asked for. */
export async function stubEmbed(context: BrowserContext): Promise<string[]> {
  const asked: string[] = [];
  await context.route(`${EMBED}**`, (route) => {
    asked.push(route.request().url());
    return route.fulfill({ contentType: 'text/html', body: '<title>Google Calendar embed stub</title>' });
  });
  return asked;
}
