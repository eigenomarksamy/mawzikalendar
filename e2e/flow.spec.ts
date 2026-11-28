import { expect, test, type Page } from '@playwright/test';

// X6's flow in a real browser: the form, the review screen, and the Google link, the
// `.ics` and the summary, each with the reviewed values. Google and eigenomar.com are
// stubbed, so the tests send nothing to either and check only what the app opens.

const THE_NIGHT = {
  title: 'Night at the Club',
  start: '2026-07-18T23:00',
  endTime: '06:00',
  timeZone: 'Europe/Berlin',
  venue: 'Hall 2, Berlin',
  lineup: 'Artist A\nArtist B',
  sourceUrl: 'https://ra.co/events/1234567',
  notes: 'Doors at 22:30',
};

const WHEN = 'Sat 18 Jul 2026, 23:00 – Sun 19 Jul 2026, 06:00 (Europe/Berlin)';
const SUMMARY = [
  'Night at the Club',
  WHEN,
  'Venue: Hall 2, Berlin',
  'Lineup: Artist A, Artist B',
  'Notes: Doors at 22:30',
  'https://ra.co/events/1234567',
].join('\n');

/** Every http(s) request the page sends to a host other than the app's own. */
function foreignRequests(page: Page, appUrl: string): string[] {
  const appHost = new URL(appUrl).host;
  const sent: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.host !== appHost) {
      sent.push(request.url());
    }
  });
  return sent;
}

async function fillForm(page: Page, values: Partial<typeof THE_NIGHT>): Promise<void> {
  for (const [name, value] of Object.entries(values)) {
    await page.locator(`[name="${name}"]`).fill(value);
  }
}

test.beforeEach(async ({ context }) => {
  await context.route('https://calendar.google.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>Google Calendar stub</title>' }),
  );
  await context.route('https://eigenomar.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>eigenomar.com stub</title>' }),
  );
});

test('an event goes from the form to the review screen and out as a link, an .ics and a summary', async ({
  page,
  browserName,
  context,
  baseURL,
}) => {
  const foreign = foreignRequests(page, baseURL ?? '');
  await page.goto('/app/');
  await expect(page.locator('[name="timeZone"]')).toHaveValue('America/New_York');

  await fillForm(page, THE_NIGHT);
  await page.getByRole('button', { name: 'Review' }).click();

  const review = page.locator('#review');
  await expect(review).toBeVisible();
  await expect(page.locator('#event-form')).toBeHidden();
  await expect(page.locator('#review-title')).toHaveText('Night at the Club');
  await expect(page.locator('#review-when')).toHaveText(WHEN);
  await expect(page.locator('#review-viewer-when')).toHaveText(
    'Sat 18 Jul 2026, 17:00 – Sun 19 Jul 2026, 00:00 (America/New_York)',
  );
  await expect(page.locator('#review-venue')).toHaveText('Hall 2, Berlin');
  await expect(page.locator('#review-lineup')).toHaveText('Artist A, Artist B');
  await expect(page.locator('#review-flags')).toBeHidden();

  // The Google link opens a prefilled event in a new tab.
  const google = page.getByRole('link', { name: 'Add to Google Calendar' });
  await expect(google).toHaveAttribute('target', '_blank');
  const popup = page.waitForEvent('popup');
  await google.click();
  const opened = new URL((await popup).url());
  expect(opened.origin + opened.pathname).toBe('https://calendar.google.com/calendar/render');
  expect(Object.fromEntries(opened.searchParams)).toEqual({
    action: 'TEMPLATE',
    text: 'Night at the Club',
    dates: '20260718T210000Z/20260719T040000Z',
    ctz: 'Europe/Berlin',
    details: 'Lineup: Artist A, Artist B\n\nDoors at 22:30\n\nhttps://ra.co/events/1234567',
    location: 'Hall 2, Berlin',
  });

  // The .ics downloads, named for the event, with the reviewed values.
  const icsLink = page.getByRole('link', { name: 'Download .ics' });
  const download = page.waitForEvent('download');
  await icsLink.click();
  expect((await download).suggestedFilename()).toBe('2026-07-18-night-at-the-club.ics');
  const ics = await icsLink.evaluate(async (link: HTMLAnchorElement) => (await fetch(link.href)).text());
  const lines = ics.replace(/\r\n /g, '').split('\r\n');
  expect(lines).toEqual(
    expect.arrayContaining([
      'BEGIN:VEVENT',
      'DTSTART:20260718T210000Z',
      'DTEND:20260719T040000Z',
      'SUMMARY:Night at the Club',
      'LOCATION:Hall 2\\, Berlin',
      'URL:https://ra.co/events/1234567',
      'END:VCALENDAR',
    ]),
  );
  expect(lines.find((line) => line.startsWith('UID:'))).toMatch(/^UID:[0-9a-f-]{36}@mawzikalendar\.eigenomar\.com$/);

  // The summary copies.
  await expect(page.locator('#summary-text')).toHaveValue(SUMMARY);
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy summary' }).click();
  await expect(page.locator('#copy-status')).toHaveText('Copied.');
  if (browserName === 'chromium') {
    // Windows' clipboard gives the text back with CRLF line endings.
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.replace(/\r\n/g, '\n')).toBe(SUMMARY);
  }

  expect(foreign).toEqual([]);
});

test('a draft with mistakes stays on the form, with a message by each field', async ({ page }) => {
  await page.goto('/app/');
  await fillForm(page, { title: '  ', start: '2026-07-18T23:00', timeZone: 'Mars/Olympus', sourceUrl: 'ra.co events' });
  await page.getByRole('button', { name: 'Review' }).click();

  await expect(page.locator('#review')).toBeHidden();
  await expect(page.locator('#error-title')).toHaveText('Give the event a title.');
  await expect(page.locator('#error-timeZone')).toHaveText('Choose a timezone from the list, such as Europe/Berlin.');
  await expect(page.locator('#error-sourceUrl')).toContainText('https://');
  await expect(page.locator('#title')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#title')).toBeFocused();
  await expect(page.locator('#error-start')).toBeHidden();
});

test('an event with no end is flagged on review, and editing keeps what was entered', async ({ page }) => {
  await page.goto('/app/');
  await fillForm(page, { title: 'Open end', start: '2026-07-18T23:00', timeZone: 'Europe/Berlin' });
  await page.getByRole('button', { name: 'Review' }).click();

  await expect(page.locator('#review-when')).toHaveText(
    'Sat 18 Jul 2026, 23:00 – Sun 19 Jul 2026, 03:00 (Europe/Berlin)',
  );
  await expect(page.locator('#review-flags')).toContainText('No end time was given');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#event-form')).toBeVisible();
  await expect(page.locator('[name="title"]')).toHaveValue('Open end');
  await expect(page.locator('[name="start"]')).toHaveValue('2026-07-18T23:00');
});

test('the footer’s eigenomar.com link opens in a new tab, and the form keeps its values', async ({ page }) => {
  await page.goto('/app/');
  await fillForm(page, { title: 'Half filled' });

  const footer = page.getByRole('contentinfo').getByRole('link', { name: 'eigenomar.com' });
  await expect(footer).toHaveAttribute('href', 'https://eigenomar.com');
  await expect(footer).toHaveAttribute('target', '_blank');
  const popup = page.waitForEvent('popup');
  await footer.click();
  expect((await popup).url()).toBe('https://eigenomar.com/');

  await expect(page).toHaveURL('/app/');
  await expect(page.locator('[name="title"]')).toHaveValue('Half filled');
});

test('the footer link works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/app/');
  const footer = page.getByRole('contentinfo').getByRole('link', { name: 'eigenomar.com' });
  await expect(footer).toHaveAttribute('href', 'https://eigenomar.com');
  await expect(footer).toHaveAttribute('target', '_blank');
  await context.close();
});
