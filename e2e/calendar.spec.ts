import { expect, test, type Page } from '@playwright/test';
import { isEmbed, stubEmbed } from './embed';

// V10's calendar view in a real browser: the demo calendar when the page opens, another
// public Google calendar from each form of its link, and an error with no embed for
// anything else. Google's embed is stubbed, so the tests send nothing to Google, and the
// page loads nothing else from another host. The viewer is in New York (playwright.config.ts).

const DEMO = '804029e95cd89e1774b3f607a8ba76ced8c2e5fcafdee554927f30a0bba0b46b@group.calendar.google.com';
const HOLIDAYS = 'en.usa#holiday@group.v.calendar.google.com';
const embedOf = (id: string): string =>
  `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(id)}&ctz=America%2FNew_York`;

let asked: string[] = [];
let foreign: string[] = [];

test.beforeEach(async ({ context, page, baseURL }) => {
  asked = await stubEmbed(context);
  foreign = [];
  const appHost = new URL(baseURL ?? '').host;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.host !== appHost && !isEmbed(request.url())) {
      foreign.push(request.url());
    }
  });
});

test.afterEach(() => {
  expect(foreign).toEqual([]);
});

async function showCalendar(page: Page, link: string): Promise<void> {
  await page.locator('#calendar-link').fill(link);
  await page.getByRole('button', { name: 'Show' }).click();
}

test('the page opens on the demo calendar, in the viewer’s timezone, linking the guide', async ({ page }) => {
  await page.goto('/');

  const embed = page.locator('#calendar-embed');
  await expect(embed).toHaveAttribute('src', embedOf(DEMO));
  // No permission is delegated to the embed.
  await expect(embed).not.toHaveAttribute('allow', /.*/);
  await expect.poll(() => asked).toEqual([embedOf(DEMO)]);

  // The calendar comes first, then the event form.
  const sections = await page.locator('main > section, main > form').evaluateAll((all) => all.map((el) => el.id));
  expect(sections.slice(0, 2)).toEqual(['calendar', 'event-form']);

  const guide = page.getByRole('link', { name: 'How to subscribe to it' });
  await expect(guide).toHaveAttribute('href', '/subscribe/');
  await guide.click();
  await expect(page).toHaveURL('/subscribe/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('how to subscribe (not import) in your calendar');
});

for (const [form, link] of [
  ['the ID itself', HOLIDAYS],
  ['an embed link', `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(HOLIDAYS)}&ctz=Europe%2FBerlin`],
  ['the public .ics address', `https://calendar.google.com/calendar/ical/${encodeURIComponent(HOLIDAYS)}/public/basic.ics`],
  ['a share link', `https://calendar.google.com/calendar/u/0?cid=${btoa(HOLIDAYS).replace(/=+$/, '')}`],
] as const) {
  test(`${form} shows that calendar, in the viewer’s timezone`, async ({ page }) => {
    await page.goto('/');
    await showCalendar(page, link);
    await expect(page.locator('#calendar-embed')).toHaveAttribute('src', embedOf(HOLIDAYS));
    await expect(page.locator('#calendar-error')).toBeHidden();
    await expect.poll(() => asked).toContain(embedOf(HOLIDAYS));
  });
}

test('anything else shows an error and no embed, until a calendar’s link is pasted', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#calendar-embed')).toHaveCount(1);

  await showCalendar(page, 'https://ra.co/events/1234567');
  await expect(page.locator('#calendar-embed')).toHaveCount(0);
  await expect(page.locator('#calendar-error')).toBeVisible();
  await expect(page.locator('#calendar-error')).toContainText('public Google calendar');
  await expect(page.locator('#calendar-link')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#calendar-link')).toBeFocused();

  await showCalendar(page, HOLIDAYS);
  await expect(page.locator('#calendar-embed')).toHaveAttribute('src', embedOf(HOLIDAYS));
  await expect(page.locator('#calendar-error')).toBeHidden();
  await expect(page.locator('#calendar-link')).not.toHaveAttribute('aria-invalid', 'true');
});

test('on a phone’s width the embed opens on its agenda, and at 40rem or wider on the month', async ({ page }) => {
  // Desktop Chrome's viewport, 1280 px wide, gives the month grid in the tests above.
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await expect(page.locator('#calendar-embed')).toHaveAttribute('src', `${embedOf(DEMO)}&mode=AGENDA`);
  await showCalendar(page, HOLIDAYS);
  await expect(page.locator('#calendar-embed')).toHaveAttribute('src', `${embedOf(HOLIDAYS)}&mode=AGENDA`);

  // 640 px is 40rem, still a phone's width; one pixel more is the month.
  await page.setViewportSize({ width: 640, height: 800 });
  await page.reload();
  await expect(page.locator('#calendar-embed')).toHaveAttribute('src', `${embedOf(DEMO)}&mode=AGENDA`);
  await page.setViewportSize({ width: 641, height: 800 });
  await page.reload();
  await expect(page.locator('#calendar-embed')).toHaveAttribute('src', embedOf(DEMO));
});

test('showing a calendar leaves the event form as it was', async ({ page }) => {
  await page.goto('/');
  await page.locator('[name="title"]').fill('Half filled');
  await showCalendar(page, HOLIDAYS);
  await expect(page.locator('[name="title"]')).toHaveValue('Half filled');
  await expect(page.locator('#review')).toBeHidden();
});
