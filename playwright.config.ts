import { defineConfig, devices } from '@playwright/test';

// The end-to-end tests run the built app, served by `vite preview`, in Chromium, Firefox
// and WebKit. The viewer is in New York, so the review screen's "your time" differs from
// the Berlin events the tests enter.
const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'en-GB',
    timezoneId: 'America/New_York',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `npx vite build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
  },
});
