import { expect, test } from '@playwright/test';

// D17's guide to subscribing to the calendar, rendered from docs/subscribe.md at build
// time, at /subscribe/ since V10. It has no script, so it is tested with JavaScript off,
// and it loads nothing from another host: its links are only followed when clicked.

const ICAL =
  'https://calendar.google.com/calendar/ical/804029e95cd89e1774b3f607a8ba76ced8c2e5fcafdee554927f30a0bba0b46b%40group.calendar.google.com/public/basic.ics';

test('the guide is at /subscribe/, with no script and nothing from another host', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const appHost = new URL(baseURL ?? '').host;
  const foreign: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.host !== appHost) foreign.push(request.url());
  });

  await page.goto('/subscribe/');

  await expect(page).toHaveTitle('mawzikalendar');
  await expect(page.getByRole('banner').getByRole('link', { name: 'mawzikalendar' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('how to subscribe (not import) in your calendar');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    '📅 apple calendar (mac/iphone/ipad)',
    '📅 outlook (web & desktop)',
    '📅 google calendar (web)',
    '📅 other calendar apps (android, thunderbird, etc.)',
    "here's said link",
  ]);
  await expect(page.locator('.guide ol').first().locator('li')).toHaveCount(4);
  await expect(page.getByRole('link', { name: ICAL })).toHaveAttribute('href', ICAL);
  await expect(page.getByRole('link', { name: 'outlook.com', exact: true })).toHaveAttribute('href', 'https://outlook.com/');
  await expect(page.getByRole('link', { name: 'google calendar', exact: true })).toHaveAttribute(
    'href',
    'https://calendar.google.com/',
  );
  await expect(page.locator('.guide ol')).toHaveCount(3);

  const footer = page.getByRole('contentinfo').getByRole('link', { name: 'eigenomar.com' });
  await expect(footer).toHaveAttribute('href', 'https://eigenomar.com');
  await expect(footer).toHaveAttribute('target', '_blank');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');

  // The guide's page has no script and no form: the app is at /.
  await expect(page.locator('script')).toHaveCount(0);
  await expect(page.locator('form')).toHaveCount(0);

  expect(foreign).toEqual([]);
  await context.close();
});
