import { expect, test, type Page } from '@playwright/test';
import { BERLIN_NIGHT, UNKNOWN_PLACE } from '../test/ra-fixtures';

// X7 in a real browser: text pasted from an ra.co page fills the form, what it leaves in
// doubt is flagged by the paste box and on the review screen, and nothing is sent to
// ra.co. Any request to ra.co is recorded and refused.

let toRa: string[] = [];

test.beforeEach(async ({ context }) => {
  toRa = [];
  for (const pattern of ['**://ra.co/**', '**://*.ra.co/**', '**://*.residentadvisor.net/**']) {
    await context.route(pattern, (route) => {
      toRa.push(route.request().url());
      return route.abort();
    });
  }
});

test.afterEach(() => {
  expect(toRa).toEqual([]);
});

async function paste(page: Page, text: string): Promise<void> {
  await page.locator('#ra-text').fill(text);
  await page.getByRole('button', { name: 'Fill the form' }).click();
}

test('a pasted ra.co page fills the form, and the review shows it', async ({ page, baseURL }) => {
  const appHost = new URL(baseURL ?? '').host;
  const foreign: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.host !== appHost) foreign.push(request.url());
  });

  await page.goto('/');
  await page.locator('[name="notes"]').fill('my own note');
  await paste(page, BERLIN_NIGHT);

  await expect(page.locator('#paste-status')).toHaveText('Filled 7 fields from the text.');
  await expect(page.locator('#paste-notes')).toBeHidden();
  await expect(page.locator('[name="title"]')).toHaveValue('Night at the Club');
  await expect(page.locator('[name="start"]')).toHaveValue('2026-07-18T23:00');
  await expect(page.locator('[name="endTime"]')).toHaveValue('07:00');
  await expect(page.locator('[name="timeZone"]')).toHaveValue('Europe/Berlin');
  await expect(page.locator('[name="venue"]')).toHaveValue('Hall 2, Example Straße 12, 10243 Berlin, Germany');
  await expect(page.locator('[name="lineup"]')).toHaveValue('Artist A\nArtist B b2b Artist C\nArtist D (live)');
  await expect(page.locator('[name="sourceUrl"]')).toHaveValue('https://ra.co/events/1234567');
  await expect(page.locator('[name="notes"]')).toHaveValue('my own note');

  await page.getByRole('button', { name: 'Review' }).click();
  await expect(page.locator('#review-when')).toHaveText(
    'Sat 18 Jul 2026, 23:00 – Sun 19 Jul 2026, 07:00 (Europe/Berlin)',
  );
  await expect(page.locator('#review-source')).toHaveText('https://ra.co/events/1234567');
  await expect(page.locator('#review-flags')).toBeHidden();
  const google = new URL((await page.locator('#google-link').getAttribute('href')) ?? '');
  expect(google.searchParams.get('details')).toContain('https://ra.co/events/1234567');

  expect(foreign).toEqual([]);
});

test('what the text leaves in doubt is flagged, until the field is edited', async ({ page }) => {
  await page.goto('/');
  await page.locator('[name="title"]').fill('typed before the paste');
  await paste(page, UNKNOWN_PLACE);

  await expect(page.locator('[name="title"]')).toHaveValue('Secret Party');
  await expect(page.locator('#paste-status')).toHaveText('Filled 3 fields from the text. Check the 4 below.');
  const notes = page.locator('#paste-notes li');
  await expect(notes).toHaveCount(4);
  await expect(page.locator('#paste-notes li[data-field="venue"]')).toHaveText('Venue: The venue is still to be announced.');
  await expect(page.locator('[name="venue"]')).toHaveAttribute('data-flagged', 'true');
  await expect(page.locator('[name="timeZone"]')).toHaveAttribute('data-flagged', 'true');

  await page.locator('[name="venue"]').fill('Somewhere, Brooklyn');
  await expect(notes).toHaveCount(3);
  await expect(page.locator('[name="venue"]')).not.toHaveAttribute('data-flagged', 'true');

  await page.getByRole('button', { name: 'Review' }).click();
  const flags = page.locator('#review-flags');
  await expect(flags).toBeVisible();
  await expect(flags.locator('li[data-field]')).toHaveText([
    /^Event page: The text has no ra\.co event link/,
    /^Timezone: The venue is in a country with several timezones/,
    /^Lineup: The text has no lineup/,
  ]);
  await expect(flags.locator('li[data-flag="end-defaulted"]')).toContainText('No end time was given');
});

test('an empty paste asks for the text and changes nothing', async ({ page }) => {
  await page.goto('/');
  await page.locator('[name="title"]').fill('Kept');
  await paste(page, '   ');
  await expect(page.locator('#paste-status')).toHaveText('Paste the text of an ra.co event page first.');
  await expect(page.locator('[name="title"]')).toHaveValue('Kept');
});
